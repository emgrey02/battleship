/**
 * Manages the DOM, there's only one so its a IIFE
 * only renders things
 * @returns {any}
 */
export const DOMManager = (() => {
  const setCurrentTurn = (player) => {
    let table = document.querySelector(".p2 .battleship-table");

    if (!player) {
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
    const createTables = () => {
      const ctn = document.querySelectorAll(".battleship-ctn");

      ctn.forEach((c) => {
        const table = document.createElement("table");
        table.classList.add("battleship-table");
        table.setAttribute("role", "grid");
        table.setAttribute("aria-label", "Battleship board");

        // create cells in table
        for (let i = 0; i < 11; i++) {
          const tr = table.insertRow();
          tr.setAttribute("role", "row");

          for (let j = 0; j < 11; j++) {
            // first row, create header cells
            if (i == 0) {
              if (j == 0) {
                // fist row, first column, empty cell
                const td = tr.insertCell();
                td.setAttribute("role", "gridcell");
              } else {
                const th = document.createElement("th");
                th.scope = "col";
                th.setAttribute("role", "columnheader");
                th.innerText = String.fromCharCode(`${96 + j}`);
                tr.appendChild(th);
              }
            } else if (j == 0) {
              // starting at second row
              const th = document.createElement("th");
              th.scope = "row";
              th.setAttribute("role", "rowheader");
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
    createTables();
    setTabIndexes();
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

  const showShipsInTracker = () => {
    let stCells = document.querySelectorAll(`.p1.ship-tracker li`);
    stCells.forEach((cell) => {
      cell.classList.remove("remove");
    });
  };

  const removeShipFromTracker = (shipNum) => {
    let ship = document.querySelector(
      `.p1.ship-tracker li:nth-child(${shipNum + 1})`,
    );
    ship.classList.add("remove");
  };

  const removeShipTrackerLabels = () => {
    let ships = document.querySelectorAll(
      `.p1.ship-tracker li span[data-name]`,
    );
    ships.forEach((label) => {
      label.style.display = "none";
    });
  };

  const addShipTrackerLabels = () => {
    let ships = document.querySelectorAll(
      `.p1.ship-tracker li span[data-name]`,
    );
    ships.forEach((label) => {
      label.style.display = "inline";
    });
  };

  const removeShipTrackerHighlights = () => {
    // make sure ship tracker highlight is off
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

  const changeShipTrackerAxis = (axis) => {
    let draggableShips = document.querySelectorAll(`.p1.ship-tracker .sq-ctn`);
    draggableShips.forEach((ship) => {
      if (axis === "x") {
        ship.classList.remove("vertical");
      } else {
        ship.classList.add("vertical");
      }
    });
  };

  const addMiss = (player, coord) => {
    let table = player.type == "real" ? "p1" : "p2";

    let cell = document.querySelector(
      `.${table} [data-x="${coord.x}"][data-y="${coord.y}"]`,
    );
    cell.classList.add("miss");
  };

  const addHit = (player, coord) => {
    let table = player.type == "real" ? "p1" : "p2";

    let cell = document.querySelector(
      `.${table} [data-x="${coord.x}"][data-y="${coord.y}"]`,
    );
    cell.classList.add("hit");

    updateShipTracker(player);
  };

  const updateShipTracker = (player) => {
    let table = player.type == "real" ? "p1" : "p2";
    // show hits
    player.gameboard.ships.forEach((ship) => {
      ship.hits.forEach((hit, index) => {
        let trackerCell = document.querySelector(
          `.${table}.ship-tracker .${ship.name} .sq:nth-child(${index + 1})`,
        );
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

  const showRealPlayerBoard = (player) => {
    player.gameboard.board.forEach((row) => {
      row.forEach((cell) => {
        if (cell !== null) {
          showShipInTable(player.type, cell.location);
        }
      });
    });
  };

  const onStartGame = () => {
    let computerBoard = document.querySelector("#computer-board");
    let playerBoard = document.querySelector("#player-board");
    let randomBtns = document.querySelector("#random-btns");
    let manualBtns = document.querySelector("#manual-btns");
    let pregameInstructions = document.querySelector("#pregame-instructions");
    let startBtn = document.querySelector("#start-game");

    computerBoard.classList.remove("remove");
    playerBoard.classList.add("small");
    startBtn.classList.add("remove");
    pregameInstructions.classList.add("remove");
    manualBtns.classList.add("remove");
    randomBtns.classList.add("remove");
  };

  const onRandomMode = () => {
    let randomBtns = document.querySelector("#random-btns");
    let manualBtns = document.querySelector("#manual-btns");
    let instructions = document.querySelector("#instructions");

    instructions.textContent =
      "keep randomizing until you are satisfied with your ship placements.";
    randomBtns.classList.remove("remove");
    manualBtns.classList.add("remove");
  };

  const onManualMode = () => {
    let randomBtns = document.querySelector("#random-btns");
    let manualBtns = document.querySelector("#manual-btns");
    let instructions = document.querySelector("#instructions");

    instructions.textContent =
      "click and drag the highlighted ship to your board.";
    randomBtns.classList.add("remove");
    manualBtns.classList.remove("remove");
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
    showShipInTable,
    addHit,
    addMiss,
    sinkShip,
    isAttackValid,
    clearBoard,
    showRealPlayerBoard,
    highlightShip,
    showStartBtn,
    hideStartBtn,
    removeDragoverHighlight,
    changeShipTrackerAxis,
    removeShipTrackerHighlights,
    addShipTrackerLabels,
    removeShipTrackerLabels,
    removeShipFromTracker,
    showShipsInTracker,
    onRandomMode,
    onManualMode,
    onStartGame,
  };
})();
