const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

const apiPath = "/api/";
const version = "v1";
const port = 3000;

app.use(bodyParser.json());
app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const songs = [
  { id: 1, title: "Cry For Me", artist: "The Weeknd" },
  { id: 2, title: "Busy Woman", artist: "Sabrina Carpenter" },
  {
    id: 3,
    title: "Call Me When You Break Up",
    artist: "Selena Gomez, benny blanco, Gracie Adams",
  },
  { id: 4, title: "Abracadabra", artist: "Lady Gaga" },
  { id: 5, title: "Róa", artist: "VÆB" },
  { id: 6, title: "Messy", artist: "Lola Young" },
  { id: 7, title: "Lucy", artist: "Idle Cave" },
  { id: 8, title: "Eclipse", artist: "parrow" },
];

const playlists = [
  { id: 1, name: "Hot Hits Iceland", songIds: [1, 2, 3, 4] },
  { id: 2, name: "Workout Playlist", songIds: [2, 5, 6] },
  { id: 3, name: "Lo-Fi Study", songIds: [] },
];

/*---------------------------
// HELPER FUNCTIONS         //
----------------------------*/
const isIdValid = (id) => {
  return Number.isInteger(id);
};

const getAllSongsFilter = (filter) => {
  const newFilterArr = [];


  songs.forEach((item) => { // loops trough each and every song and checks if the filter is included either in the name or artist, if so it id pushed to the new array which is then returned
    if (
      item.title.toLowerCase().includes(filter.toLowerCase()) ||
      item.artist.toLowerCase().includes(filter.toLowerCase())
    ) {
      newFilterArr.push(item);
    }
  });
  return newFilterArr;
};

const songExists = (newSong) => {
  let duplicateFound = false;
  songs.forEach((existingSong) => { // loops trough every song and checks if both title and artist matches the new song, if so true is returned
    if (
      existingSong.title.toLowerCase() === newSong.title.toLowerCase() &&
      existingSong.artist.toLowerCase() === newSong.artist.toLowerCase()
    ) {
      duplicateFound = true;
    }
  });
  return duplicateFound;
};

const playlistExists = (newPlaylist) => {
  let duplicateFound = false;
  playlists.forEach((existingPlaylist) => {
    if ( // loops trough every playlist and checks if the name already exists, if so true is returned
      existingPlaylist.name.toLowerCase() === newPlaylist.name.toLowerCase()
    ) {
      duplicateFound = true;
    }
  });
  return duplicateFound;
};

const getItem = (id, objArr) => {
  // function takes in a array of object and checks if the id passed in belongs to one of those object
  let foundItem = null;
  objArr.forEach((item) => {
    if (item.id === id) { // id found
      foundItem = item;
    }
  });
  return foundItem; // null is returned if item is NOT found
};

const updateItem = (id, availableEditOptions, arrayObj, body) => {
  let updatedItem = null;
  arrayObj.forEach((item) => {
    if (item.id === id) { 
      Object.keys(body).forEach((key) => { //if the object matches the id passed in, we loop trough each key
        if (availableEditOptions.includes(key)) { //we then loop trough each key in the body, if the key in the body is in the available edit attributes, we then update the value of the object in the array
          item[key] = body[key];
        }
      });
      updatedItem = item;
    }
  });
  return updatedItem; // if item was never found Null is returned
};

const removeItem = (id, arrayObj) => {
  let removedItem = null;
  arrayObj.forEach((item, i) => {
    if (id === item.id) {
      removedItem = arrayObj.splice(i, 1)[0]; // if id matches we slice the array, removeing the item and then returning it
    }
  });
  return removedItem;
};

const isSongInUse = (id) => {
  let inUse = false;

  playlists.forEach((playlist) => { // loops trough each playlist and if the song id passed in is in any of them then true is returned
    if (playlist.songIds.includes(id)) {
      inUse = true;
    }
  });

  return inUse;
};

const getSongArr = (playList) => {
  const songArr = playList.songIds; 
  const arraySongObjects = [];

  songs.forEach((song) => { //loop trough each song, if the song is in the playlist songId aray then we push it to the new array
    if (songArr.includes(song.id)) {
      arraySongObjects.push(song);
    }
  });

  return arraySongObjects; 
};

const isString = (input) => {
  // function that simply validates if the input is an array by checking it's type
  if (!(typeof input === 'string')) {
    return false;
  }
  return true;
};


const isOnlySpaces = (str) =>{
  return str.trim() === '';
}
/*---------------------------
// END OF HELPER FUNCTIONS //
----------------------------*/
// Keep track of Id's
let nextSongId = 9;
let nextPlaylistId = 4;

/* --------------------------
      SONGS ENDPOINTS    
-------------------------- */

app.get(apiPath + version + '/songs', (req, res) => {
  const filter = req.query.filter;
  validQuery = true

  Object.keys(req.query).forEach((value) => { // loop trough the attribtus, and check if everything is a string
    if (value !== 'filter') {
      validQuery = false
    }
  });

  if (!validQuery) { // invalid, includes something that is not 'filter'
    return res.status(400).json({ message: 'Invalid query' });

  }

  if (!filter) { // if there is no filter just return all songs straight away
    return res.status(200).json(songs);
  }
  const newFilterArr = getAllSongsFilter(filter.trim()); // helper function that returns all songs that matches the filter
  return res.status(200).json(newFilterArr);
});

app.post(apiPath + version + '/songs', (req, res) => {
  if (!req.body.title || !req.body.artist) { // if both title are undefined, then a 400 status response is sent
    return res.status(400).json({ message: 'Both "title" and "artist" fields are required.' });
  }

  else if (!(isString(req.body.title)) || !(isString(req.body.artist))) { // if neither titlie or artist are string, then the request is not valid
    return res.status(400).json({ message: 'Both "title" and "artist" must be strings' });
  }

  req.body.title = req.body.title.trim();
  req.body.artist = req.body.artist.trim();

  const newSong = { id: nextSongId, title: req.body.title, artist: req.body.artist };

  if (songExists({ title: req.body.title, artist: req.body.artist })) { // if a song already exists with artist and name then, song wont be created
    return res.status(400).json({ message: 'This song is already in the playlist. Duplicate entries are not allowed.' });
  }
  nextSongId++;
  songs.push(newSong); // add new song to the array

  return res.status(201).json(newSong); // song has been created and updated
});

app.patch(apiPath + version + '/songs/:songId', (req, res) => {
  const availableEditOptions = ['title', 'artist'];
  const songID = Number(req.params.songId);

  if (!isIdValid(songID)) { // id must be a integer
    return res.status(400).json({ message: 'Invalid ID, ID must be an integer.' });
  }

  if (req.body.title === undefined && req.body.artist === undefined) { // if both artist and title are undefined then there is nothign to update and err is returned
    return res.status(400).json({ message: 'At least one field ("title" or "artist") must be provided for update.' });
  }
  let isInputAString = true;
  Object.values(req.body).forEach((value) => { // loop trough the attribtus, and check if everything is a string
    if (!isString(value)) {
      isInputAString = false;
    }
  });
  if (!isInputAString) { // if not a string, error response is returned
    return res.status(400).json({ message: 'All edited fields must be of the string type' });

  }

  const updatedSong = updateItem(songID, availableEditOptions, songs, req.body); // helper function that updated the song in the songs arr

  if (!updatedSong) { // if the helper functions could not find a song with the id, a error is returned
    return res.status(404).json({ message: 'A song was not found with the ID provided.' });
  }

  return res.status(200).json(updatedSong); // return the updated song
});

app.delete(apiPath + version + '/songs/:songId', (req, res) => {
  const songID = Number(req.params.songId);
  if (!isIdValid(songID)) { // songid must be a integer
    return res.status(400).json({ message: 'Invalid ID, ID must be an integer.' });
  }
  if (isSongInUse(songID)) { // helper function that checks if a playlist has the song, a error is returned if so
    return res.status(400).json({ message: 'This song cannot be removed as it is in use by a playlist.' });
  }

  const removedSong = removeItem(songID, songs); // remove the song from the songs Arr
  if (!removedSong) { // if there was no song to remove, a error is returned
    return res.status(404).json({ message: `No song was found for the ID ${songID}.` });
  }

  return res.status(200).json(removedSong); // return the removed song
});

/* --------------------------
      PLAYLISTS ENDPOINTS    
-------------------------- */

app.get(apiPath + version + '/playlists', (req, res) => {
  return res.status(200).json(playlists); // return the array that returns all playlists
});

app.get('/api/v1/playlists/:playListID', (req, res) => {
  const playListID = Number(req.params.playListID);
  if (!isIdValid(playListID)) { //check if id is valid if not a error  messageis returned
    return res.status(400).json({ message: 'Invalid ID, ID must be an integer.' });
  }

  const foundPlaylist = getItem(playListID, playlists); // helper function that returns the playlist that matches the ID
  if (foundPlaylist) {
    return res.status(200).json({id: foundPlaylist.id, name: foundPlaylist.name, songIds: foundPlaylist.songIds, songs: getSongArr(foundPlaylist)});
  }

  return res.status(404).json({ message: `No playlist existed with the ID ${playListID}.` }); // id did not exist fot the playlist entered
});

app.post(apiPath + version + '/playlists', (req, res) => {
  if (!req.body.name) { // playlist is needed in order for a new playlist being created
    return res.status(400).json({ message: 'The "name" field is required.' });
  }


  else if (!(typeof req.body.name === 'string') || isOnlySpaces(req.body.name)) { // if name is not a string or only included spaces, then it is invalid
    return res.status(400).json({ message: 'The name of the playlist must be a string and not only include spaces' });
  }

  req.body.name = req.body.name.trim();
  const newPlaylist = { id: nextPlaylistId, name: req.body.name, songIds: [] }; // create the new playlist
  
  if (playlistExists(req.body)) { // if a playlisst exists with the exact name then a error message is returned
    return res.status(400).json({ message: `A playlist already exists with the name ${req.body.name}.` });
  }
  nextPlaylistId++;
  playlists.push(newPlaylist);

  return res.status(201).json(newPlaylist); // return the new playlist
});

app.patch(apiPath + version + '/playlists/:playlistId/songs/:songId', (req, res) => { 
  const playlistId = Number(req.params.playlistId);
  const songId = Number(req.params.songId);
  
  if (!isIdValid(playlistId) || !isIdValid(songId)) { // id's must be integers if not, error message is returned
    return res.status(400).json({ message: 'Playlist ID and Song ID must be integers.' });
  }

  const playlist = getItem(playlistId, playlists);
  const song = getItem(songId, songs);
  
  if (!playlist || !song) { // if either song or playlist are not found with the id's passed in a error message is returned
    return res.status(404).json({ message: 'Either playlist ID or song ID (possibly both) do not exist.' });
  }

  if (playlist.songIds.includes(songId)) { // if the playlist already has the song trying to add, return a error message
    return res.status(400).json({ message: 'This song is already in this playlist.' });
  }

  // update the playlist that is being returned
  playlist.songIds.push(songId);

  return res.status(200).json({id: playlist.id, name: playlist.name, songIds: playlist.songIds, songs: getSongArr(playlist)});
});

app.use('*', (req, res) => {
  // this endpoint catches all http request that are not defined in the end points above
  res.status(405).json({ message: 'Operation not supported.' });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

module.exports = app;
