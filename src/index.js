import "./styles.scss";
import { Player } from "./models/player.js";
import { Ship } from "./models/ship.js";
import { Gameboard } from "./models/gameboard.js";

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
      for (let i = 0; i < 11; i++) {
        const tr = table.insertRow();

        for (let j = 0; j < 11; j++) {
          // first row, create header cells
          if (i == 0) {
            if (j == 0) {
              // fist row, first column, empty cell
              const td = tr.insertCell();
            } else {
              const th = document.createElement("th");
              th.scope = "col";
              th.innerText = String.fromCharCode(`${96 + j}`);
              tr.appendChild(th);
            }
          } else if (j == 0) {
            // starting at second row
            const th = document.createElement("th");
            th.scope = "row";
            th.innerText = i;
            tr.appendChild(th);
          } else {
            const td = tr.insertCell();
            td.classList.add("battleship-table__cell");
            td.dataset.x = i - 1;
            td.dataset.y = j - 1;

            // add accessibility roles
            td.setAttribute("role", "gridcell");
            td.setAttribute(
              "aria-label",
              `Cell ${String.fromCharCode(96 + j)}${i}`,
            );
          }
        }
      }

      c.appendChild(table);
    });
  };

  const setTabIndexes = () => {
    let cpuTable = document.querySelectorAll(
      ".p2 table .battleship-table__cell",
    );
    cpuTable.forEach((cell) => {
      cell.tabIndex = 0;
    });
  };

  const setCurrentTurn = (player) => {
    let table = document.querySelector(".p2 .battleship-table");

    if (!player) {
      console.log("game over.");
      table.classList.remove("my-turn");
      return;
    }
    const youLabel = document.querySelector("#you");
    const computerLabel = document.querySelector("#computer");
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
    setTabIndexes();
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
      ship.hits.forEach((hit, index) => {
        let cell = document.querySelector(
          `.${table} [data-x="${hit.x}"][data-y="${hit.y}"]`,
        );
        let trackerCell = document.querySelector(
          `.${table}.ship-tracker .${ship.name} .sq:nth-child(${index + 1})`,
        );
        cell.classList.add("hit");
        trackerCell.classList.add("hit");
      });
    });
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
    console.log("checking if attack is valid");
    console.log(playerType);
    console.log(coord);
    let table = playerType == "real" ? "p1" : "p2";
    const cell = document.querySelector(
      `.${table} [data-x="${coord.x}"][data-y="${coord.y}"]`,
    );
    if (cell.classList.contains("miss") || cell.classList.contains("hit")) {
      console.log("invalid hit");
      return false;
    } else {
      console.log("valid hit");
      return true;
    }
  };

  const listenForAttack = (handler) => {
    const cells = document.querySelectorAll(`.p2 .battleship-table__cell`);
    cells.forEach((cell) => {
      cell.addEventListener("click", (e) => handler(e));
      cell.addEventListener("keydown", (e) => handler(e));
    });
  };

  const stopListeningForAttack = (handler) => {
    const cells = document.querySelectorAll(`.p2 .battleship-table__cell`);
    cells.forEach((cell) => {
      cell.removeEventListener("click", handler);
      cell.removeEventListener("keydown", handler);
    });
  };

  const showRealPlayerBoard = (player) => {
    player.gameboard.board.forEach((row) => {
      row.forEach((cell) => {
        if (cell != null) {
          showShipInTable("real", cell.location);
        }
      });
    });
  };

  return {
    setCurrentTurn,
    pregameSetup,
    showShipInTable,
    updateTable,
    sinkShip,
    isAttackValid,
    clearBoard,
    listenForAttack,
    stopListeningForAttack,
    showRealPlayerBoard,
  };
})();

const GameManager = (() => {
  let _p1turnCount = 0;
  let _p2turnCount = 0;

  let _playerTurn;
  let _winner;

  let _p1 = Player("real");
  let _p2 = Player("computer");

  const computerAttack = (coords, res) => {
    return {
      coords,
      res,
    };
  };

  let cpuAttackHistory = [];

  let searchingForNextHit = false;
  let lastHit;
  let foundNextHit = false;
  let hitArray = [];
  let justSunkOne = false;

  const startGame = () => {
    DOMManager.pregameSetup();

    let psBtn = document.querySelector("#place-ships-btn");

    psBtn.addEventListener("click", () => {
      eraseBoard(_p1);
      DOMManager.clearBoard(_p1.type);

      placeShipsOnBoard(_p1);
      DOMManager.showRealPlayerBoard(_p1);

      startBtn.classList.remove("hide");
    });

    let startBtn = document.querySelector("#start-game");
    let computerBoard = document.querySelector("#computer-board");
    startBtn.classList.add("hide");

    startBtn.addEventListener("click", () => {
      psBtn.classList.add("remove");
      computerBoard.classList.remove("remove");
      placeShipsOnBoard(_p2);

      // set current turn
      _playerTurn = _p1;
      startTurn();

      startBtn.classList.add("hide");
    });
  };

  const placeShipsOnBoard = (player) => {
    // place ships
    player.gameboard.ships.forEach((ship) => {
      player.gameboard.placeShip(ship);
    });
  };

  const startTurn = async () => {
    if (_playerTurn == _p1) {
      DOMManager.setCurrentTurn(_p1);
      DOMManager.listenForAttack(startPlayerAttack);
    } else {
      DOMManager.setCurrentTurn(_p2);
      DOMManager.stopListeningForAttack(startPlayerAttack);
      setTimeout(() => startComputerAttack(), 500);
    }
  };

  const startPlayerAttack = (e) => {
    if (
      event.type === "click" ||
      (event.type === "keydown" && event.key === "Enter")
    ) {
      // get coords
      let coords = { x: +e.target.dataset.x, y: +e.target.dataset.y };

      // make sure cell hasn't been hit or missed already
      if (DOMManager.isAttackValid(_p2.type, coords)) {
        _p1turnCount++;
        if (_p2.gameboard.receiveAttack(coords)) {
          DOMManager.updateTable(_p2);
          let ship = _p2.gameboard.board[coords.x][coords.y];
          if (ship.isSunk()) {
            DOMManager.sinkShip(_p2.type, ship);
          }
          if (checkWin(_p2)) {
            _winner = _p1;
            endGame();
          } else {
            // player goes again
            _playerTurn = _p1;
            startTurn();
          }
        } else {
          // missed
          DOMManager.updateTable(_p2);
          _playerTurn = _p2;
          startTurn();
        }
      }
    }
  };

  const getValidAdjacentCoords = (coord) => {
    console.log("getting valid adj coords");
    console.log(`current coord: ${[coord.x, coord.y]}`);
    let validCoords = [];
    if (coord.x > 0) {
      // check above
      let upCoord = { x: coord.x - 1, y: coord.y };
      let aboveRes = DOMManager.isAttackValid("real", upCoord);
      if (aboveRes) validCoords.push(upCoord);
    }

    if (coord.y > 0) {
      // check left
      let leftCoord = { x: coord.x, y: coord.y - 1 };
      let leftRes = DOMManager.isAttackValid("real", leftCoord);
      if (leftRes) validCoords.push(leftCoord);
    }

    if (coord.x < 9) {
      // check bottom
      let downCoord = { x: coord.x + 1, y: coord.y };
      let downCoordRes = DOMManager.isAttackValid("real", downCoord);
      if (downCoordRes) validCoords.push(downCoord);
    }

    if (coord.y < 9) {
      // check right
      let rightCoord = { x: coord.x, y: coord.y + 1 };
      let rightRes = DOMManager.isAttackValid("real", rightCoord);
      if (rightRes) validCoords.push(rightCoord);
    }

    console.log("returning valid coords");
    validCoords.forEach((c) => {
      console.log(`${c.x}, ${c.y}`);
    });
    return validCoords;
  };

  const getShipAxis = (hitArray) => {
    // get the direction the ship is going based on two coordinates
    let xCoord = hitArray[0].x;
    let yCoord = hitArray[0].y;

    console.log("x-direction: ");
    let xDirection = hitArray.every((val, index) => {
      // x is the same
      console.log(`${index}: comparing ${val.x} and ${xCoord}`);
      return val.x == xCoord;
    });

    console.log("y-direction: ");
    let yDirection = hitArray.every((val, index) => {
      // y is the same
      console.log(`${index}: comparing ${val.y} and ${yCoord}`);
      return val.y == yCoord;
    });

    return yDirection ? "yAxis" : "xAxis";
  };

  const getCoordBasedOnAxis = (axis, coordsArray) => {
    let options = [];
    if (axis === "xAxis") {
      coordsArray.forEach((coords) => {
        if (coords.y > 0) {
          let c = { x: coords.x, y: coords.y - 1 };
          DOMManager.isAttackValid("real", c) && options.push(c);
        }

        if (coords.y < 9) {
          let c = { x: coords.x, y: coords.y + 1 };
          DOMManager.isAttackValid("real", c) && options.push(c);
        }
      });
    } else {
      coordsArray.forEach((coords) => {
        if (coords.x > 0) {
          let c = { x: coords.x - 1, y: coords.y };
          DOMManager.isAttackValid("real", c) && options.push(c);
        }

        if (coords.x < 9) {
          let c = { x: coords.x + 1, y: coords.y };
          DOMManager.isAttackValid("real", c) && options.push(c);
        }
      });
    }

    options.forEach((coord) => {
      console.log(`option: ${coord.x}, ${coord.y}`);
    });

    let index = Math.floor(Math.random() * options.length);
    console.log(`index : ${index}`);
    return options[index];
  };

  const startComputerAttack = async () => {
    let attackCoord;

    let lastAttack = cpuAttackHistory
      ? cpuAttackHistory[cpuAttackHistory.length - 1]
      : false;

    // computer is working on sinking a ship
    if ((lastAttack && lastAttack.res) || searchingForNextHit || foundNextHit) {
      // last attack was a hit, or we are searching bc we recently had a hit, or we just hit again
      // time to search

      // computer hit a ship for the first time
      if (lastAttack.res && !foundNextHit) {
        console.log("last attack was a hit");
        searchingForNextHit = true;
        let adjacentCoords = getValidAdjacentCoords(
          hitArray[hitArray.length - 1],
        );
        attackCoord =
          adjacentCoords[Math.floor(Math.random() * adjacentCoords.length)];
        console.log("coord: " + attackCoord.x + " , " + attackCoord.y);
      } else if (foundNextHit && hitArray.length > 0) {
        let axis = getShipAxis(hitArray);
        console.log("axis: " + axis);
        attackCoord = getCoordBasedOnAxis(axis, hitArray);
        console.log([attackCoord.x, attackCoord.y]);
      } else {
        console.log("still searching, coordinate set to adjacent cell");
        let adjacentCoords = getValidAdjacentCoords(
          hitArray[hitArray.length - 1],
        );
        attackCoord =
          adjacentCoords[Math.floor(Math.random() * adjacentCoords.length)];
        console.log("coord: " + attackCoord.x + " , " + attackCoord.y);
      }

      // attack an adjacent coordinate
    } else {
      // random coordinate
      console.log("attacking random coordinate");
      attackCoord = {
        x: Math.floor(Math.random() * 10),
        y: Math.floor(Math.random() * 10),
      };
    }

    console.log("seeing if computer attack is valid");
    console.log([attackCoord.x, attackCoord.y]);
    if (DOMManager.isAttackValid(_p1.type, attackCoord)) {
      _p2turnCount++;

      if (_p1.gameboard.receiveAttack(attackCoord)) {
        // its a hit
        if (searchingForNextHit) {
          console.log("found a hit after searching");
          foundNextHit = true;
        }

        hitArray.push(attackCoord);

        DOMManager.updateTable(_p1);
        let ship = _p1.gameboard.board[attackCoord.x][attackCoord.y];

        // add to cpu attack array as a hit
        let newAttack = computerAttack(attackCoord, true);
        cpuAttackHistory.push(newAttack);

        if (ship.isSunk()) {
          DOMManager.sinkShip(_p1.type, ship);
          // clear hit array, and stop searching for next hit: go back to random
          hitArray = [];
          searchingForNextHit = false;
          foundNextHit = false;
          let fauxAttack = computerAttack({ x: 0, y: 0 }, false);
          cpuAttackHistory.push(fauxAttack);
        }

        if (checkWin(_p1)) {
          // computer won the game
          _winner = _p2;
          endGame();
        } else {
          // computer goes again
          _playerTurn = _p2;
          startTurn();
        }
      } else {
        console.log("computer missed");
        // its a miss, turn over
        DOMManager.updateTable(_p1);
        _playerTurn = _p1;

        // add to cpu attack array as a miss
        let newAttack = computerAttack(attackCoord, false);
        cpuAttackHistory.push(newAttack);

        startTurn();
      }
    } else {
      // tell computer to go again
      startComputerAttack();
    }
  };
  // check if player's board has all sunken ships
  const checkWin = (player) => {
    return player.gameboard.checkSunkShips();
  };

  const eraseBoard = (player) => {
    player.gameboard.eraseBoard();
  };

  const endGame = () => {
    let popUp = document.querySelector("#pop-up");
    popUp.classList.remove("remove");

    let winText = popUp.querySelector("p:first-child");
    winText.textContent = `${_winner.type == "real" ? "YOU WON!" : "YOU LOST :("}`;

    // let winnerHits = 17;
    // let winnerMisses = _winner.gameboard.missedShots.length;

    // let loserHits =
    //   _winner.type == "real"
    //     ? _p2turnCount - _p2.gameboard.missedShots.length
    //     : _p1turnCount - _p1.gameboard.missedShots.length;
    // let loserMisses =
    //   _winner.type == "real"
    //     ? _p1.gameboard.missedShots.length
    //     : _p2.gameboard.missedShots.length;

    // let winnerInfo = document.querySelector("#winner-info");

    // let loserInfo = document.querySelector("#loser-info");

    // let winnerTurnText = winnerInfo.querySelector("p:first-child");

    // winnerTurnText.textContent = `${Math.round(winnerHits / winnerMisses + winnerHits)}% accuracy`;

    // let loserTurnText = loserInfo.querySelector("p:first-child");

    // loserTurnText.textContent = `${Math.round(loserHits / loserMisses + loserHits)}% accuracy`;

    let btn = popUp.querySelector("button");
    btn.focus();
    btn.addEventListener("click", () => {
      window.location.reload();
    });

    DOMManager.setCurrentTurn(null);
    DOMManager.stopListeningForAttack(startPlayerAttack);
    _playerTurn = null;
  };

  return {
    startGame,
  };
})();

GameManager.startGame();
