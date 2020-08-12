const express = require("express");
const app = express();

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

var io = require("socket.io")(listener);

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

var users = {};

//routes
app.get("/", (req, res) => {
  res.render("board");
});

//socket connections and logic

//adding user
var addUser = socket => {
  users[socket.id] = socket;
};

//removing user
var removeUser = socket => {
  delete users[socket.id];
};

let players = {},
  freeplayer = null;

function pairOpponent(socket) {
  players[socket.id] = {
    socket: socket,
    name: socket.username,
    opponent: freeplayer
  };
  if (freeplayer) {
    players[socket.id].symbol = "O";
    players[freeplayer].opponent = socket.id;
    freeplayer = null;
  } else {
    freeplayer = socket.id;
    players[socket.id].symbol = "X";
  }
}

function getOpponent(socket) {
  if (players[socket.id].opponent) {
    return players[players[socket.id].opponent].socket;
  } else return false;
}

//socket connection
io.on("connection", socket => {
  socket.on("adduser", data => {
    socket.username = data.username;
    addUser(socket);
  });

  //pairing with an opponent
  pairOpponent(socket);

  //starting game for socket and opponent
  if (getOpponent(socket)) {
    socket.emit("begin-game", { symbol: players[socket.id].symbol });
    getOpponent(socket).emit("begin-game", {
      symbol: players[getOpponent(socket).id].symbol
    });
  }

  socket.on("move-made", data => {
    console.log(data);
    if (getOpponent(socket)) {
      getOpponent(socket).emit("move-made", data);
    }
  });

  socket.on("restart-req", () => {
    getOpponent(socket).emit("restart-req");
  });

  socket.on("restart-accept", () => {
    getOpponent(socket).emit("restart-accept");
  });

  socket.on("disconnect", () => {
    //sending opponent left prompt to opponent
    if (getOpponent(socket)) {
      getOpponent(socket).emit("opponent-left");
    }
    removeUser(socket);
  });
});
