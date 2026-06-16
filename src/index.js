import "./styles.scss";
import { Player, Gameboard, Ship } from "./factories.js";

/**
 * Manages the DOM, there's only one so its a IIFE
 * @returns {any}
 */
const DOMManager = (() => {
  const createTables = () => {
    const ctn = document.querySelectorAll(".battleship-ctn");

    ctn.forEach((c) => {
      const table = document.createElement("table");
      table.classList.add("battleship-table");

      // create cells in table
      for (let i = 0; i < 10; i++) {
        const tr = table.insertRow();

        for (let j = 0; j < 10; j++) {
          const td = tr.insertCell();
          td.classList.add("battleship-table__cell");
          td.dataset.x = i;
          td.dataset.y = j;
        }
      }

      c.appendChild(table);
    });
  };

  const messages = document.querySelector("#scrollable-content");

  const youLabel = document.querySelector("#you");
  const computerLabel = document.querySelector("#computer");

  const setMessage = (text) => {
    let firstChild = messages.firstChild;

    let newMessage = document.createElement("p");
    newMessage.textContent = text;
    messages.insertBefore(newMessage, firstChild);
  };

  const setCurrentTurn = (player) => {
    let table = document.querySelector(".p2 .battleship-table");

    if (!player) {
      console.log("game over.");
      table.classList.remove("my-turn");
      return;
    }

    youLabel.classList.remove("highlight");
    computerLabel.classList.remove("highlight");

    if (player.type == "real") {
      youLabel.classList.add("highlight");
      table.classList.add("my-turn");
    } else {
      computerLabel.classList.add("highlight");
      table.classList.remove("my-turn");
    }
  };

  const pregameSetup = () => {
    createTables();
  };

  const updateTable = (player) => {
    let table = player.type == "real" ? "p1" : "p2";

    // show missed shots
    player.gameboard.missedShots.forEach((coord) => {
      let cell = document.querySelector(
        `.${table} [data-x="${coord.x}"][data-y="${coord.y}"]`,
      );
      cell.classList.add("miss");
    });

    // show hits
    player.gameboard.ships.forEach((ship) => {
      ship.hits.forEach((hit) => {
        let cell = document.querySelector(
          `.${table} [data-x="${hit.x}"][data-y="${hit.y}"]`,
        );
        cell.classList.add("hit");
      });
    });

    //
  };

  const clearBoard = (playerType) => {
    let table = playerType == "real" ? "p1" : "p2";
    const cells = document.querySelectorAll(`.${table} [data-x][data-y]`);
    cells.forEach((cell) => {
      cell.classList = "battleship-table__cell";
    });
  };

  const showShipInTable = (playerType, coordArr) => {
    let table = playerType == "real" ? "p1" : "p2";
    coordArr.forEach((c) => {
      const cell = document.querySelector(
        `.${table} [data-x="${c.x}"][data-y="${c.y}"]`,
      );
      cell.classList.add("battleship-table__taken");
    });
  };

  const sinkShip = (playerType, ship) => {
    let table = playerType == "real" ? "p1" : "p2";
    ship.location.forEach((coord) => {
      const cell = document.querySelector(
        `.${table} [data-x="${coord.x}"][data-y="${coord.y}"]`,
      );
      cell.classList.add("sunk");
    });
  };

  const isAttackValid = (playerType, coord) => {
    let table = playerType == "real" ? "p1" : "p2";
    const cell = document.querySelector(
      `.${table} [data-x="${coord.x}"][data-y="${coord.y}"]`,
    );
    if (cell.classList.contains("miss") || cell.classList.contains("hit")) {
      return false;
    } else {
      return true;
    }
  };

  return {
    setMessage,
    setCurrentTurn,
    pregameSetup,
    showShipInTable,
    updateTable,
    sinkShip,
    isAttackValid,
    clearBoard,
  };
})();

const GameManager = (() => {
  let _playerTurn;

  let _p1 = Player("real");
  let _p2 = Player("computer");

  // check if player's board has all sunken ships
  const checkWin = (player) => {
    return player.gameboard.checkSunkShips();
  };

  const eraseBoard = (player) => {
    player.gameboard.eraseBoard();
  };

  const endGame = () => {
    DOMManager.setCurrentTurn(null);
    stopListeningForAttack();
    _playerTurn = null;
  };

  const startGame = () => {
    DOMManager.pregameSetup();

    let psBtn = document.querySelector("#place-ships-btn");

    psBtn.addEventListener("click", () => {
      eraseBoard(_p1);
      DOMManager.clearBoard(_p1.type);

      placeShipsOnBoard(_p1);
      showRealPlayerBoard();

      startBtn.classList.remove("hide");
    });

    let startBtn = document.querySelector("#start-game");
    startBtn.classList.add("hide");

    startBtn.addEventListener("click", () => {
      psBtn.classList.add("remove");
      placeShipsOnBoard(_p2);

      // set current turn
      _playerTurn = _p1;
      startTurn();

      startBtn.classList.add("hide");

      // clear message
      DOMManager.setMessage("");
    });
  };

  const showRealPlayerBoard = () => {
    _p1.gameboard.board.forEach((row) => {
      row.forEach((cell) => {
        if (cell != null) {
          DOMManager.showShipInTable("real", cell.location);
        }
      });
    });
  };

  const placeShipsOnBoard = (player) => {
    // place ships
    player.gameboard.ships.forEach((ship) => {
      player.gameboard.placeShip(ship);
    });
  };

  const computerAttack = async () => {
    DOMManager.setMessage("Waiting for computer attack...");
    let randomCoord = {
      x: Math.floor(Math.random() * 10),
      y: Math.floor(Math.random() * 10),
    };
    if (DOMManager.isAttackValid(_p1.type, randomCoord)) {
      setTimeout(() => {
        if (_p1.gameboard.receiveAttack(randomCoord)) {
          DOMManager.updateTable(_p1);
          let ship = _p1.gameboard.board[randomCoord.x][randomCoord.y];
          DOMManager.setMessage(`Computer hit your ${ship.name}!`);

          if (ship.isSunk()) {
            DOMManager.setMessage(`Computer has sunk your ${ship.name}!`);
            DOMManager.sinkShip(_p1.type, ship);
          }

          if (checkWin(_p1)) {
            DOMManager.setMessage("COMPUTER WON.");
          } else {
            // computer goes again
            _playerTurn = _p2;
            startTurn();
          }
        } else {
          DOMManager.setMessage("Computer missed!");
          DOMManager.updateTable(_p1);
          _playerTurn = _p1;
          startTurn();
        }
      }, 1000);
    } else {
      DOMManager.setMessage("Computer made an invalid attack");

      // tell computer to go again
      computerAttack();
    }
  };

  const startTurn = async () => {
    if (_playerTurn == _p1) {
      DOMManager.setCurrentTurn(_p1);
      listenForAttack();
    } else {
      DOMManager.setCurrentTurn(_p2);
      stopListeningForAttack();
      setTimeout(() => computerAttack(), 1000);
    }
  };

  const playerAttack = (e) => {
    // get coords
    let coords = { x: +e.target.dataset.x, y: +e.target.dataset.y };

    if (DOMManager.isAttackValid(_p2.type, coords)) {
      if (_p2.gameboard.receiveAttack(coords)) {
        DOMManager.setMessage("You hit a ship!");
        DOMManager.updateTable(_p2);
        let ship = _p2.gameboard.board[coords.x][coords.y];
        if (ship.isSunk()) {
          DOMManager.setMessage(`You've sunk your opponent's ${ship.name}`);
          DOMManager.sinkShip(_p2.type, ship);
        }
        if (checkWin(_p2)) {
          DOMManager.setMessage("YOU WON.");
          endGame();
        } else {
          // computer goes again
          _playerTurn = _p1;
          startTurn();
        }
      } else {
        DOMManager.setMessage("You missed!");
        DOMManager.updateTable(_p2);
        _playerTurn = _p2;
        startTurn();
      }
    } else {
      DOMManager.setMessage("You made an invalid attack");
    }
  };

  const listenForAttack = () => {
    console.log("listening for attack");
    const cells = document.querySelectorAll(`.p2 .battleship-table__cell`);
    cells.forEach((cell) => {
      cell.addEventListener("click", playerAttack);
    });
  };

  const stopListeningForAttack = () => {
    console.log("stop listening for attack");
    const cells = document.querySelectorAll(`.p2 .battleship-table__cell`);
    cells.forEach((cell) => {
      cell.removeEventListener("click", playerAttack);
    });
  };

  return {
    startGame,
  };
})();

GameManager.startGame();
