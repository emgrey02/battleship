import "./styles.scss";
import { Player } from "./models/player.js";
import { Ship } from "./models/ship.js";
import { Gameboard } from "./models/gameboard.js";
import { DOMManager } from "./ui-renderer.js";
import { polyfill } from "mobile-drag-drop";
import { scrollBehaviourDragImageTranslateOverride } from "mobile-drag-drop/scroll-behaviour.js";

polyfill({
  // use this to make use of the scroll behaviour
  dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
});

const Controller = (() => {
  let _playerTurn;
  let _winner;

  let _p1 = Player("real");
  let _p2 = Player("computer");

  // computer attack
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

  // drag and drop
  let axis = "x";
  let resetShipPlacementHandler = null;
  let shipNum = 0;

  const setUpPregameListeners = () => {
    let random = document.querySelector("#random");
    let manual = document.querySelector("#manual");

    let xAxis = document.querySelector("#x-axis");
    let yAxis = document.querySelector("#y-axis");

    let randomizeBtn = document.querySelector("#randomize-btn");
    let startBtn = document.querySelector("#start-game");
    let lockShipBtn = document.querySelector("#next-ship-btn");

    DOMManager.hideStartBtn();
    lockShipBtn.disabled = true;
    setAxis("x");

    if (random.checked) {
      DOMManager.onRandomMode();
      DOMManager.addShipTrackerLabels();
      eraseBoard(_p1);
    } else {
      DOMManager.onManualMode();
      DOMManager.removeShipTrackerLabels();
      onManualPlacement();
    }

    xAxis.addEventListener("change", (e) => {
      if (xAxis.checked) {
        setAxis(xAxis.value);
        DOMManager.changeShipTrackerAxis(xAxis.value);
      }
    });

    yAxis.addEventListener("change", () => {
      if (yAxis.checked) {
        setAxis(yAxis.value);
        DOMManager.changeShipTrackerAxis(yAxis.value);
      }
    });

    random.addEventListener("change", (e) => {
      if (random.checked) {
        eraseBoard(_p1);
        setAxis("x");
        DOMManager.onRandomMode();
        DOMManager.hideStartBtn();
        DOMManager.removeShipTrackerHighlights();
        DOMManager.addShipTrackerLabels();
        DOMManager.changeShipTrackerAxis("x");
        DOMManager.showShipsInTracker();
      }
    });

    randomizeBtn.addEventListener("click", (e) => {
      onRandomizeBtnClicked();
      DOMManager.showStartBtn();
    });

    manual.addEventListener("change", () => {
      if (manual.checked) {
        // switch to manual placement mode
        shipNum = 0;
        lockShipBtn.disabled = true;

        DOMManager.onManualMode();
        DOMManager.removeShipTrackerLabels();
        DOMManager.hideStartBtn();
        DOMManager.showShipsInTracker();
        onManualPlacement();
      }
    });

    startBtn.addEventListener("click", () => {
      DOMManager.onStartGame();
      DOMManager.removeShipTrackerHighlights();
      DOMManager.addShipTrackerLabels();
      DOMManager.showShipsInTracker();
      onStartBtnClicked();
    });

    lockShipBtn.addEventListener("click", (e) => {
      DOMManager.removeShipFromTracker(shipNum);

      let cellArray = _p1.gameboard.ships[shipNum].location;
      DOMManager.removeDragoverHighlight(cellArray);

      shipNum++;
      if (shipNum < 5) {
        onManualPlacement();
      } else {
        // disable reset ship btn after last ship is locked in & show start btn
        let resetShipBtn = document.querySelector("#reset-btn");
        resetShipBtn.disabled = true;
        DOMManager.showStartBtn();
      }

      lockShipBtn.disabled = true;
    });
  };

  const startGame = () => {
    DOMManager.pregameSetup();
    setUpPregameListeners();
  };

  const setAxis = (a) => {
    let xAxis = document.querySelector("#x-axis");
    let yAxis = document.querySelector("#y-axis");

    if (a === "x") {
      axis = "x";
      xAxis.checked = true;
    } else {
      axis = "y";
      yAxis.checked = true;
    }
  };

  const onManualPlacement = () => {
    let currentShip = _p1.gameboard.ships[shipNum];

    let dropTarget = document.querySelector(`.p1 .battleship-table`);
    dropTarget.id = "drop-target";

    if (shipNum == 0) {
      eraseBoard(_p1);
    }

    DOMManager.highlightShip(currentShip);
    listenForDragEvents();
    listenForShipReset(resetShip);
  };

  const onDragOver = (e) => {
    let currentShip = _p1.gameboard.ships[shipNum];

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

  const onDragLeave = (e) => {
    let currentShip = _p1.gameboard.ships[shipNum];

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

  const onDrop = (e) => {
    let resetShipBtn = document.querySelector("#reset-btn");
    let lockShipBtn = document.querySelector("#next-ship-btn");
    let currentShip = _p1.gameboard.ships[shipNum];

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
      _p1.gameboard.placeShip(currentShip, cellArray);
      DOMManager.showShipInTable("real", cellArray);
      lockShipBtn.disabled = false;
      resetShipBtn.disabled = false;
      removeDragEventListeners();
    }
  };

  const onDragEnter = (e) => {
    e.preventDefault();
  };

  const resetShip = () => {
    let currentShip = _p1.gameboard.ships[shipNum];

    _p1.gameboard.removeShip(currentShip);
    DOMManager.clearBoard(_p1);
    DOMManager.showRealPlayerBoard(_p1);

    // remove start game button if reset button was pressed when placing patrol boat (the last boat)
    if (currentShip.length == 2) {
      DOMManager.hideStartBtn();
    }

    // disable lock ship btn
    let lockShipBtn = document.querySelector("#next-ship-btn");
    lockShipBtn.disabled = true;

    // disable reset btn
    let resetShipBtn = document.querySelector("#reset-btn");
    resetShipBtn.disabled = true;

    // reattach event listeners
    listenForDragEvents();
  };

  const listenForShipReset = (handler) => {
    let resetShipBtn = document.querySelector("#reset-btn");
    // remove previous listener
    if (resetShipPlacementHandler) {
      resetShipBtn.removeEventListener("click", resetShipPlacementHandler);
    }
    // set new listener
    resetShipPlacementHandler = handler;
    resetShipBtn.disabled = true;
    resetShipBtn.addEventListener("click", resetShipPlacementHandler);
  };

  const removeShipResetListener = () => {
    let resetShipBtn = document.querySelector("#reset-btn");
    if (resetShipPlacementHandler) {
      resetShipBtn.removeEventListener("click", resetShipPlacementHandler);
      resetShipPlacementHandler = null;
    }
  };

  const listenForDragEvents = () => {
    let dropTarget = document.querySelector(`.p1 .battleship-table`);

    dropTarget.addEventListener("dragenter", onDragEnter);
    dropTarget.addEventListener("dragover", onDragOver);
    dropTarget.addEventListener("dragleave", onDragLeave);
    dropTarget.addEventListener("drop", onDrop);
  };

  const removeDragEventListeners = () => {
    let dropTarget = document.querySelector(`.p1 .battleship-table`);

    dropTarget.removeEventListener("dragenter", onDragEnter);
    dropTarget.removeEventListener("dragover", onDragOver);
    dropTarget.removeEventListener("dragleave", onDragLeave);
    dropTarget.removeEventListener("drop", onDrop);
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
      setAxis("x");
      DOMManager.changeShipTrackerAxis("x");
    }
  };

  const placeShipsOnBoardRandomly = (player) => {
    // place ships
    player.gameboard.ships.forEach((ship) => {
      player.gameboard.placeShip(ship);
    });

    // update ui if it's player's board
    if (player.type === "real") {
      DOMManager.showRealPlayerBoard(_p1);
    }
  };

  const listenForAttack = () => {
    const cells = document.querySelectorAll(`.p2 .battleship-table__cell`);
    cells.forEach((cell) => {
      cell.addEventListener("click", startPlayerAttack);
      cell.addEventListener("keydown", startPlayerAttack);
    });
  };

  const stopListeningForAttack = () => {
    const cells = document.querySelectorAll(`.p2 .battleship-table__cell`);
    cells.forEach((cell) => {
      cell.removeEventListener("click", startPlayerAttack);
      cell.removeEventListener("keydown", startPlayerAttack);
    });
  };

  const startTurn = async () => {
    if (_playerTurn == _p1) {
      DOMManager.setCurrentTurn(_p1);
      listenForAttack();
    } else {
      DOMManager.setCurrentTurn(_p2);
      stopListeningForAttack();
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
        if (_p2.gameboard.receiveAttack(coords)) {
          DOMManager.addHit(_p2, coords);
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
          DOMManager.addMiss(_p2, coords);
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

      if (_p1.gameboard.receiveAttack(attackCoord)) {
        // its a hit

        if (searchingForNextHit) {
          // found a second hit!
          foundNextHit = true;
        }

        // add to hit array
        hitArray.push(attackCoord);

        DOMManager.addHit(_p1, attackCoord);
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
        DOMManager.addMiss(_p1, attackCoord);
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

    let btn = popUp.querySelector("button");
    btn.focus();
    btn.addEventListener("click", () => {
      window.location.reload();
    });

    DOMManager.setCurrentTurn(null);
    stopListeningForAttack();
    _playerTurn = null;
  };

  return {
    startGame,
  };
})();

Controller.startGame();
