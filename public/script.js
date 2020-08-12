const classX = "x";
const classO = "o";
let myTurn,
  currentClass,
  restartReq = false;
const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];
const boxs = document.querySelectorAll(".box");
const board = document.querySelector(".board");
const message = document.querySelector(".message");
const messagePrompt = document.querySelector(".message-prompt");
const restart = document.querySelector(".restart");
const infoMessage = document.querySelector(".info-message");

function startGame() {
  clearBoard();
  setHoverState();
  boxs.forEach(box =>
    box.addEventListener("click", handleClick, { once: true })
  );
}

function handleClick(el) {
  if (!myTurn) {
    return;
  }
  placeMark(el.target.id, currentClass);
  socket.emit("move-made", {
    targetId: el.target.id,
    currentClass: currentClass
  });
  isGameOver(currentClass);
}

function placeMark(targetId, currentClass) {
  document.getElementById(targetId).classList.add(currentClass);
}

function switchTurns() {
  myTurn = !myTurn;
  board.classList.toggle("avoid-clicks");
}

function setHoverState() {
  board.classList.add(currentClass);
  if (currentClass == "o") {
    board.classList.add("avoid-clicks");
  }
}
function isGameOver(currentClass) {
  if (checkWin(currentClass)) {
    isDraw(false, currentClass);
  } else if (checkDraw()) {
    isDraw(true, currentClass);
  } else {
    switchTurns();
    showTurn();
  }
}
function isDraw(draw, symbol) {
  if (draw) {
    message.innerText = "It's a Draw!";
  } else {
    message.innerText = `${currentClass == symbol ? "You won!" : "You lost!"}`;
  }
  messagePrompt.classList.add("show");
}

function checkWin(currentClass) {
  return WINNING_COMBINATIONS.some(combination => {
    return combination.every(index => {
      return boxs[index].classList.contains(currentClass);
    });
  });
}

function checkDraw() {
  return [...boxs].every(box => {
    return box.classList.contains(classX) || box.classList.contains(classO);
  });
}

restart.addEventListener("click", () => {
  if (!restartReq) {
    restart.innerText = "Request Sent";
    socket.emit("restart-req");
  } else {
    socket.emit("restart-accept");
    restartGame();
  }
});

function restartGame() {
  currentClass = currentClass == "x" ? "o" : "x";
  restartReq = false;
  myTurn = currentClass == "x";
  showTurn();
  startGame();
  restart.innerText = "Rematch";
}
function clearBoard() {
  boxs.forEach(box => {
    box.classList = "box";
    board.classList = "board";
    box.removeEventListener("click", handleClick);
  });
  messagePrompt.classList.remove("show");
}

function showTurn() {
  if (myTurn) {
    infoMessage.innerText = "Your Turn!";
    $(".board").add(".show");
  } else {
    infoMessage.innerText = "Opponent's Turn!";
  }
}

let username;
username = window.prompt("Please enter your name", "");

if (username == null || username == "") {
  alert("Username is required to play!");
  window.location.href = "/";
} else {
  var socket = io();

  //send username & add user
  socket.emit("adduser", { username });

  socket.on("begin-game", data => {
    currentClass = data.symbol == "X" ? classX : classO;
    myTurn = data.symbol === "X";
    showTurn();
    startGame();
  });

  socket.on("move-made", data => {
    placeMark(data.targetId, data.currentClass);
    isGameOver(data.currentClass);
  });

  socket.on("restart-req", () => {
    restart.innerText = "Accept Rematch?";
    restartReq = true;
  });

  socket.on("restart-accept", () => {
    restartGame();
  });

  socket.on("opponent-left", data => {
    infoMessage.innerText = "User Left!";
    board.classList.toggle("avoid-clicks");
  });
}
