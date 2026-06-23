import "./styles.scss";
import { Player } from "./models/player.js";
import { Ship } from "./models/ship.js";
import { Gameboard } from "./models/gameboard.js";

/**
 * Manages the DOM, there's only one so its a IIFE
 * @returns {any}
 */
const DOMManager = (() => {
  let shipNum = 0;
  let resetShipPlacementHandler = null;

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

    const playerTable = document.querySelector("#player-board");
    const cpuTable = document.querySelector("#computer-board");

    playerTable.classList.remove("highlight");
    cpuTable.classList.remove("highlight");

    if (player.type == "real") {
      cpuTable.classList.add("highlight");
      table.classList.add("my-turn");
    } else {
      playerTable.classList.add("highlight");
      table.classList.remove("my-turn");
    }
  };

  const pregameSetup = () => {
    createTables();
    setTabIndexes();
  };

  const setUpPregameListeners = async (
    randomizeHandler,
    manualPlacementHandler,
    startGameHandler,
  ) => {
    let pregameInstructions = document.querySelector("#pregame-instructions");
    let instructions = document.querySelector("#instructions");

    let random = document.querySelector("#random");
    let manual = document.querySelector("#manual");

    let randomBtns = document.querySelector("#random-btns");
    let manualBtns = document.querySelector("#manual-btns");

    let randomizeBtn = document.querySelector("#randomize-btn");

    let startBtn = document.querySelector("#start-game");

    let computerBoard = document.querySelector("#computer-board");
    let playerBoard = document.querySelector("#player-board");

    let nextShipBtn = document.querySelector("#next-ship-btn");

    startBtn.classList.add("hide");
    nextShipBtn.disabled = true;

    if (random.checked) {
      instructions.textContent =
        "keep randomizing until you are satisfied with your ship placements.";
      randomBtns.classList.remove("remove");
      manualBtns.classList.add("remove");
    } else {
      instructions.textContent =
        "click and drag the highlighted ship to your board.";
      randomBtns.classList.add("remove");
      manualBtns.classList.remove("remove");
      manualPlacementHandler(shipNum);
    }

    random.addEventListener("change", (e) => {
      if (random.checked) {
        instructions.textContent =
          "keep randomizing until you are satisfied with your ship placements.";
        randomBtns.classList.remove("remove");
        manualBtns.classList.add("remove");
        removeShipHighlights();
        changeToXAxis();
      }
    });

    randomizeBtn.addEventListener("click", (e) => {
      randomizeHandler();
      showStartBtn();
    });

    manual.addEventListener("change", () => {
      if (manual.checked) {
        randomBtns.classList.add("remove");
        manualBtns.classList.remove("remove");
        startBtn.classList.add("hide");
        instructions.textContent =
          "click and drag the highlighted ship to your board.";
        shipNum = 0;
        nextShipBtn.disabled = true;
        manualPlacementHandler(shipNum);
      }
    });

    nextShipBtn.addEventListener("click", (e) => {
      shipNum++;
      if (shipNum < 4) {
        manualPlacementHandler(shipNum);
      } else {
        manualPlacementHandler(shipNum);
      }
      nextShipBtn.disabled = true;
    });

    startBtn.addEventListener("click", () => {
      randomizeBtn.classList.add("remove");
      computerBoard.classList.remove("remove");
      playerBoard.classList.add("small");
      startBtn.classList.add("remove");
      pregameInstructions.classList.add("remove");

      removeShipHighlights();

      startGameHandler();
    });
  };

  const highlightShip = (ship) => {
    let allShips = document.querySelectorAll(`.p1.ship-tracker .sq-ctn`);
    allShips.forEach((shipCtn) => {
      shipCtn.classList.remove("draggable");
      shipCtn.draggable = false;
    });
    let currentShip = document.querySelector(
      `.p1.ship-tracker .sq-ctn.${ship.name}`,
    );
    currentShip.classList.add("draggable");
    currentShip.draggable = true;
  };

  const removeShipHighlights = () => {
    // make sure highlight is off
    let ships = document.querySelectorAll(`.p1.ship-tracker .sq-ctn`);
    ships.forEach((shipCell) => {
      shipCell.classList.remove("draggable");
      shipCell.draggable = false;
    });
  };

  const removeDragoverHighlight = (cellArray) => {
    cellArray.forEach((coord) => {
      let cell = document.querySelector(
        `.p1 [data-x="${coord.x}"][data-y="${coord.y}"]`,
      );
      cell.classList.remove("dragover");
    });
  };

  const onDragOver = (handler) => {
    let dropTarget = document.querySelector(`.p1 .battleship-table`);
    dropTarget.id = "drop-target";
    dropTarget.addEventListener("dragover", handler);
  };

  const onDragLeave = (handler) => {
    let dropTarget = document.querySelector(`.p1 .battleship-table`);
    dropTarget.addEventListener("dragleave", handler);
  };

  const onDrop = (handler) => {
    let dropTarget = document.querySelector(`.p1 .battleship-table`);
    dropTarget.addEventListener("drop", handler);
  };

  const removeDragEventListeners = (handler1, handler2, handler3) => {
    let dropTarget = document.querySelector(`.p1 .battleship-table`);
    dropTarget.removeEventListener("dragover", handler1);
    dropTarget.removeEventListener("dragleave", handler2);
    dropTarget.removeEventListener("drop", handler3);
  };

  const removeResetShipListener = (handler) => {
    let resetBtn = document.querySelector("#reset-btn");
    resetBtn.removeEventListener("click", handler);
  };

  const changeToXAxis = () => {
    let draggableShips = document.querySelectorAll(`.p1.ship-tracker .sq-ctn`);
    draggableShips.forEach((ship) => {
      ship.classList.remove("vertical");
    });
  };

  const onChangeAxis = (handler) => {
    let axisBtn = document.querySelector("#axis-btn");
    axisBtn.addEventListener("click", () => {
      console.log("axis btn clicked");
      let draggableShips = document.querySelectorAll(
        `.p1.ship-tracker .sq-ctn`,
      );
      draggableShips.forEach((ship) => {
        console.log(ship.classList);
        console.log("toggling");
        ship.classList.toggle("vertical");
      });
      handler();
    });
  };

  const onResetShipPlacement = (handler) => {
    let resetBtn = document.querySelector("#reset-btn");
    // remove previous listener
    if (resetShipPlacementHandler) {
      resetBtn.removeEventListener("click", resetShipPlacementHandler);
    }
    // set new listener
    resetShipPlacementHandler = handler;
    resetBtn.disabled = true;
    resetBtn.addEventListener("click", resetShipPlacementHandler);
  };

  const removeResetShipPlacement = () => {
    let resetBtn = document.querySelector("#reset-btn");
    if (resetShipPlacementHandler) {
      resetBtn.removeEventListener("click", resetShipPlacementHandler);
      resetShipPlacementHandler = null;
    }
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

  const clearBoard = (player) => {
    let table = player.type == "real" ? "p1" : "p2";
    const cells = document.querySelectorAll(`.${table} [data-x][data-y]`);
    cells.forEach((cell) => {
      cell.classList = "battleship-table__cell";
    });
    console.log(player.gameboard.board);
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
      console.log(row);
      row.forEach((cell) => {
        if (cell !== null) {
          console.log("show ship in table");
          showShipInTable("real", cell.location);
        }
      });
    });
  };

  const showStartBtn = () => {
    let startBtn = document.querySelector("#start-game");
    startBtn.classList.remove("hide");
  };

  const hideStartBtn = () => {
    let startBtn = document.querySelector("#start-game");
    startBtn.classList.add("hide");
  };

  return {
    setCurrentTurn,
    pregameSetup,
    setUpPregameListeners,
    showShipInTable,
    updateTable,
    sinkShip,
    isAttackValid,
    clearBoard,
    listenForAttack,
    stopListeningForAttack,
    showRealPlayerBoard,
    highlightShip,
    onDragOver,
    onDragLeave,
    onDrop,
    removeDragEventListeners,
    showStartBtn,
    hideStartBtn,
    removeDragoverHighlight,
    onChangeAxis,
    onResetShipPlacement,
    removeResetShipListener,
    changeToXAxis,
    removeShipHighlights,
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
  let axis = "x";

  const startGame = () => {
    DOMManager.pregameSetup();
    DOMManager.setUpPregameListeners(
      onRandomizeBtnClicked,
      onManualPlacement,
      onStartBtnClicked,
    );

    DOMManager.onChangeAxis(switchAxis);
  };

  const switchAxis = () => {
    if (axis === "x") {
      axis = "y";
    } else {
      axis = "x";
    }
  };

  const onManualPlacement = (shipNum) => {
    let currentShip = _p1.gameboard.ships[shipNum];

    if (shipNum == 0) {
      eraseBoard(_p1);
    }

    const dragoverEventHandler = (e) => {
      let cellLoc = {
        x: +`${e.target.dataset.x}`,
        y: +`${e.target.dataset.y}`,
      };
      let shipLength = currentShip.length;
      let cellArray = [];
      for (let i = 0; i < shipLength; i++) {
        if (axis === "x") {
          cellArray.push({ x: cellLoc.x, y: cellLoc.y + i });
        } else {
          cellArray.push({ x: cellLoc.x + i, y: cellLoc.y });
        }
      }
      if (_p1.gameboard.checkCoords(cellArray)) {
        cellArray.forEach((coord) => {
          let cell = document.querySelector(
            `.p1 [data-x="${coord.x}"][data-y="${coord.y}"]`,
          );
          cell.classList.add("dragover");
        });
      }
      e.preventDefault();
    };

    const dragLeaveEventHandler = (e) => {
      let cellLoc = {
        x: +`${e.target.dataset.x}`,
        y: +`${e.target.dataset.y}`,
      };
      let shipLength = currentShip.length;
      let cellArray = [];
      for (let i = 0; i < shipLength; i++) {
        if (axis === "x") {
          cellArray.push({ x: cellLoc.x, y: cellLoc.y + i });
        } else {
          cellArray.push({ x: cellLoc.x + i, y: cellLoc.y });
        }
      }
      if (_p1.gameboard.checkCoords(cellArray)) {
        cellArray.forEach((coord) => {
          let cell = document.querySelector(
            `.p1 [data-x="${coord.x}"][data-y="${coord.y}"]`,
          );
          cell.classList.remove("dragover");
        });
      }
    };

    const dropEventHandler = (e) => {
      let cellLoc = {
        x: +`${e.target.dataset.x}`,
        y: +`${e.target.dataset.y}`,
      };
      let shipLength = currentShip.length;
      let cellArray = [];
      for (let i = 0; i < shipLength; i++) {
        if (axis === "x") {
          cellArray.push({ x: cellLoc.x, y: cellLoc.y + i });
        } else {
          cellArray.push({ x: cellLoc.x + i, y: cellLoc.y });
        }
      }

      let nextShipBtn = document.querySelector("#next-ship-btn");
      let resetBtn = document.querySelector("#reset-btn");

      if (_p1.gameboard.checkCoords(cellArray)) {
        console.log("placing ship");
        _p1.gameboard.placeShip(currentShip, cellArray);
        DOMManager.removeDragoverHighlight(cellArray);
        DOMManager.showShipInTable("real", cellArray);
        nextShipBtn.disabled = false;
        resetBtn.disabled = false;
        if (shipLength == 2) {
          DOMManager.showStartBtn();
          nextShipBtn.disabled = true;
        }
        DOMManager.removeDragEventListeners(
          dragoverEventHandler,
          dragLeaveEventHandler,
          dropEventHandler,
        );
      }
    };

    const resetShip = () => {
      _p1.gameboard.removeShip(currentShip);
      DOMManager.clearBoard(_p1);
      DOMManager.showRealPlayerBoard(_p1);

      // remove start game button if reset button was pressed when placing patrol boat (the last boat)
      if (currentShip.length == 2) {
        DOMManager.hideStartBtn();
      }

      // disable placenextship btn
      let nextShipBtn = document.querySelector("#next-ship-btn");
      nextShipBtn.disabled = true;

      let resetBtn = document.querySelector("#reset-btn");
      resetBtn.disabled = true;

      // reattach event listeners
      DOMManager.onDragOver(dragoverEventHandler);
      DOMManager.onDragLeave(dragLeaveEventHandler);
      DOMManager.onDrop(dropEventHandler);
    };

    DOMManager.highlightShip(currentShip);
    DOMManager.onDragOver(dragoverEventHandler);
    DOMManager.onDragLeave(dragLeaveEventHandler);
    DOMManager.onDrop(dropEventHandler);
    DOMManager.onResetShipPlacement(resetShip);
  };

  const onRandomizeBtnClicked = () => {
    eraseBoard(_p1);
    placeShipsOnBoardRandomly(_p1);
  };

  const onStartBtnClicked = () => {
    // randomly place cpu ships
    placeShipsOnBoardRandomly(_p2);
    // set current turn
    _playerTurn = _p1;
    startTurn();

    if (axis === "y") {
      switchAxis();
      DOMManager.changeToXAxis();
    }
  };

  const placeShipsOnBoardRandomly = (player) => {
    // place ships
    player.gameboard.ships.forEach((ship) => {
      player.gameboard.placeShip(ship);
    });

    // update ui if it's player's board
    if (player.type === "real") {
      console.log("showing real player board");
      DOMManager.showRealPlayerBoard(_p1);
    }
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
    return validCoords;
  };

  const getShipAxis = (hitArray) => {
    // get the direction the ship is going based on two coordinates
    let xCoord = hitArray[0].x;
    let yCoord = hitArray[0].y;

    let xDirection = hitArray.every((val, index) => {
      // x is the same
      return val.x == xCoord;
    });

    let yDirection = hitArray.every((val, index) => {
      // y is the same
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

    let index = Math.floor(Math.random() * options.length);
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
        // last attack was a hit
        searchingForNextHit = true;
        let adjacentCoords = getValidAdjacentCoords(
          hitArray[hitArray.length - 1],
        );
        attackCoord =
          adjacentCoords[Math.floor(Math.random() * adjacentCoords.length)];
      } else if (foundNextHit && hitArray.length > 0) {
        // we hit a ship more than once
        let axis = getShipAxis(hitArray);
        attackCoord = getCoordBasedOnAxis(axis, hitArray);
      } else {
        // we recently had a hit but haven't hit a ship twice yet
        let adjacentCoords = getValidAdjacentCoords(
          hitArray[hitArray.length - 1],
        );
        attackCoord =
          adjacentCoords[Math.floor(Math.random() * adjacentCoords.length)];
      }
    } else {
      // random coordinate
      attackCoord = {
        x: Math.floor(Math.random() * 10),
        y: Math.floor(Math.random() * 10),
      };
    }

    if (DOMManager.isAttackValid(_p1.type, attackCoord)) {
      // attack hits a cell we haven't hit yet
      _p2turnCount++;

      if (_p1.gameboard.receiveAttack(attackCoord)) {
        // its a hit

        if (searchingForNextHit) {
          // found a second hit!
          foundNextHit = true;
        }

        // add to hit array
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
    DOMManager.clearBoard(player);
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
