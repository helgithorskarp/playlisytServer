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
  songs.forEach((item) => {
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
  songs.forEach((existingSong) => {
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
    if (
      existingPlaylist.name.toLowerCase() === newPlaylist.name.toLowerCase()
    ) {
      duplicateFound = true;
    }
  });
  return duplicateFound;
};

const getItem = (id, objArr) => {
  let foundItem = null;
  objArr.forEach((item) => {
    if (item.id === id) {
      foundItem = item;
    }
  });
  return foundItem;
};

const updateItem = (id, availableEditOptions, arrayObj, body) => {
  let updatedItem = null;
  arrayObj.forEach((item) => {
    if (item.id === id) {
      Object.keys(body).forEach((key) => {
        if (availableEditOptions.includes(key)) {
          item[key] = body[key];
        }
      });
      updatedItem = item;
    }
  });
  return updatedItem;
};

const removeItem = (id, arrayObj) => {
  let removedItem = null;
  arrayObj.forEach((item, i) => {
    if (id === item.id) {
      removedItem = arrayObj.splice(i, 1)[0];
    }
  });
  return removedItem;
};

const isSongInUse = (id) => {
  let inUse = false;

  playlists.forEach((playlist) => {
    if (playlist.songIds.includes(id)) {
      inUse = true;
    }
  });

  return inUse;
};

const getSongArr = (playList) => {
  const songArr = playList.songIds; 
  const arraySongObjects = [];

  songs.forEach((song) => {
    if (songArr.includes(song.id)) {
      arraySongObjects.push(song);
    }
  });

  return arraySongObjects;
};
/*---------------------------
// END OF HELPER FUNCTIONS //
----------------------------*/
let nextSongId = 9;
let nextPlaylistId = 4;

/* --------------------------
      SONGS ENDPOINTS    
-------------------------- */

app.get('/api/v1/songs', (req, res) => {
  const filter = req.query.filter ? req.query.filter.trim() : "";

  if (!filter) {
    return res.status(200).json(songs);
  }

  const newFilterArr = getAllSongsFilter(filter);
  return res.status(200).json(newFilterArr);
});

app.post('/api/v1/songs', (req, res) => {
  if (!req.body.title || !req.body.artist) {
    return res.status(400).json({ message: 'Both "title" and "artist" fields are required.' });
  }

  const newSong = { id: nextSongId, title: req.body.title, artist: req.body.artist };

  if (songExists({ title: req.body.title, artist: req.body.artist })) {
    return res.status(400).json({ message: 'This song is already in the playlist. Duplicate entries are not allowed.' });
  }
  nextSongId++;
  songs.push(newSong);

  return res.status(201).json(newSong);
});

app.patch('/api/v1/songs/:songId', (req, res) => {
  const availableEditOptions = ['title', 'artist'];
  const songID = Number(req.params.songId);

  if (!isIdValid(songID)) {
    return res.status(400).json({ message: 'Invalid ID, ID must be an integer.' });
  }

  if (req.body.title === undefined && req.body.artist === undefined) {
    return res.status(400).json({ message: 'At least one field ("title" or "artist") must be provided for update.' });
  }

  const updatedSong = updateItem(songID, availableEditOptions, songs, req.body);

  if (!updatedSong) {
    return res.status(404).json({ message: 'A song was not found with the ID provided.' });
  }

  return res.status(200).json(updatedSong);
});

app.delete('/api/v1/songs/:songId', (req, res) => {
  const songID = Number(req.params.songId);
  if (!isIdValid(songID)) {
    return res.status(400).json({ message: 'Invalid ID, ID must be an integer.' });
  }
  if (isSongInUse(songID)) {
    return res.status(400).json({ message: 'This song cannot be removed as it is in use by a playlist.' });
  }

  const removedSong = removeItem(songID, songs);
  if (!removedSong) {
    return res.status(404).json({ message: `No song was found for the ID ${songID}.` });
  }

  return res.status(200).json(removedSong);
});

/* --------------------------
      PLAYLISTS ENDPOINTS    
-------------------------- */

app.get('/api/v1/playlists', (req, res) => {
  return res.status(200).json(playlists);
});

app.get('/api/v1/playlists/:playListID', (req, res) => {
  const playListID = Number(req.params.playListID);
  if (!isIdValid(playListID)) {
    return res.status(400).json({ message: 'Invalid ID, ID must be an integer.' });
  }

  const foundPlaylist = getItem(playListID, playlists);
  if (foundPlaylist) {
    const songsArr = getSongArr(foundPlaylist);
    foundPlaylist.songs = songsArr;
    return res.status(200).json(foundPlaylist);
  }

  return res.status(404).json({ message: `No playlist existed with the ID ${playListID}.` });
});

app.post('/api/v1/playlists', (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({ message: 'The "name" field is required.' });
  }

  const newPlaylist = { id: nextPlaylistId, name: req.body.name, songIds: [] };

  if (playlistExists(req.body)) {
    return res.status(400).json({ message: `A playlist already exists with the name ${req.body.name}.` });
  }
  nextPlaylistId++;
  playlists.push(newPlaylist);

  return res.status(201).json(newPlaylist);
});

app.patch('/api/v1/playlists/:playlistId/songs/:songId', (req, res) => { 
  const playlistId = Number(req.params.playlistId);
  const songId = Number(req.params.songId);
  
  if (!isIdValid(playlistId) || !isIdValid(songId)) {
    return res.status(400).json({ message: 'Playlist ID and Song ID must be integers.' });
  }

  const playlist = getItem(playlistId, playlists);
  const song = getItem(songId, songs);
  
  if (!playlist || !song) {
    return res.status(404).json({ message: 'Either playlist ID or song ID (possibly both) do not exist.' });
  }

  if (playlist.songIds.includes(songId)) {
    return res.status(400).json({ message: 'This song is already in this playlist.' });
  }

  playlist.songIds.push(songId);
  playlist.songs = getSongArr(playlist);

  return res.status(200).json(playlist);
});

app.use('*', (req, res) => {
  res.status(405).json({ message: 'Operation not supported.' });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

module.exports = app;
