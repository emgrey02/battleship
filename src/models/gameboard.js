import { Ship } from "./ship.js";

export const Gameboard = () => {
  let board = Array.from({ length: 10 }, () => Array(10).fill(null));
  let missedShots = [];

  let ships = [
    Ship(5, "carrier"),
    Ship(4, "battleship"),
    Ship(3, "destroyer"),
    Ship(3, "submarine"),
    Ship(2, "patrol-boat"),
  ];

  const eraseBoard = () => {
    board.forEach((row, rowNum) => {
      row.forEach((col, colNum) => {
        board[rowNum][colNum] = null;
      });
    });
  };

  const getRandomCoords = (length, board) => {
    let optionsArray = [];

    const checkDirection = (dir, loc = { x: 0, y: 0 }, length) => {
      let validCells = [];

      switch (dir) {
        case "left":
          if (loc.y >= length - 1) {
            for (let i = 0; i < length; i++) {
              if (!board[loc.x][loc.y - i]) {
                const coord = { x: loc.x, y: loc.y - i };
                if (checkSurroundingCells(board, coord)) {
                  validCells.push(coord);
                } else {
                  return false;
                }
              } else {
                return false;
              }
            }
            return validCells;
          }
          return false;
          break;
        case "right":
          if (loc.y <= 9 - (length - 1)) {
            for (let i = 0; i < length; i++) {
              if (!board[loc.x][loc.y + i]) {
                const coord = { x: loc.x, y: loc.y + i };
                if (checkSurroundingCells(board, coord)) {
                  validCells.push(coord);
                } else {
                  return false;
                }
              } else {
                return false;
              }
            }
            return validCells;
          }
          return false;
          break;
        case "up":
          if (loc.x >= length - 1) {
            for (let i = 0; i < length; i++) {
              if (!board[loc.x - i][loc.y]) {
                const coord = { x: loc.x - i, y: loc.y };
                if (checkSurroundingCells(board, coord)) {
                  validCells.push(coord);
                } else {
                  return false;
                }
              } else {
                return false;
              }
            }
            return validCells;
          }
          return false;
          break;
        case "down":
          if (loc.x <= 9 - (length - 1)) {
            for (let i = 0; i < length; i++) {
              if (!board[loc.x + i][loc.y]) {
                const coord = { x: loc.x + i, y: loc.y };
                if (checkSurroundingCells(board, coord)) {
                  validCells.push(coord);
                } else {
                  return false;
                }
              } else {
                return false;
              }
            }
            return validCells;
          }
          return false;
          break;
        default:
          break;
      }
    };

    board.forEach((row, rowNum) => {
      row.forEach((cell, cellNum) => {
        if (cell == null) {
          // its a possibility, check directions starting from that cell
          const currLoc = { x: rowNum, y: cellNum };
          let leftRes = checkDirection("left", currLoc, length);
          leftRes && optionsArray.push(leftRes);
          let rightRes = checkDirection("right", currLoc, length);
          rightRes && optionsArray.push(rightRes);
          let upRes = checkDirection("up", currLoc, length);
          upRes && optionsArray.push(upRes);
          let downRes = checkDirection("down", currLoc, length);
          downRes && optionsArray.push(downRes);
        }
      });
    });
    //console.log(optionsArray);
    return optionsArray[Math.floor(Math.random() * optionsArray.length)];
  };

  const checkSurroundingCells = (board, coord) => {
    let validMatrix = [
      [false, false, false],
      [false, true, false],
      [false, false, false],
    ];

    if (coord.x == 0) {
      // top line clear
      validMatrix[0][0] = true;
      validMatrix[0][1] = true;
      validMatrix[0][2] = true;
    } else if (!board[coord.x - 1][coord.y]) {
      // cell above is null / open
      validMatrix[0][1] = true;

      //top left
      if (coord.y - 1 >= 0) {
        if (!board[coord.x - 1][coord.y - 1]) {
          validMatrix[0][0] = true;
        } else {
          return false;
        }
      }

      //top right
      if (coord.y + 1 <= 9) {
        if (!board[coord.x - 1][coord.y + 1]) {
          validMatrix[0][2] = true;
        } else {
          return false;
        }
      }
    } else {
      return false;
    }

    if (coord.y == 0) {
      // left line clear
      validMatrix[0][0] = true;
      validMatrix[1][0] = true;
      validMatrix[2][0] = true;
    } else if (!board[coord.x][coord.y - 1]) {
      // cell to the left is null / open
      validMatrix[1][0] = true;

      //bottom left
      if (coord.x + 1 < 9) {
        if (!board[coord.x + 1][coord.y - 1]) {
          validMatrix[2][0] = true;
        } else {
          return false;
        }
      }
    } else {
      return false;
    }

    if (coord.x == 9) {
      // bottom line clear
      validMatrix[2][0] = true;
      validMatrix[2][1] = true;
      validMatrix[2][2] = true;
    } else if (!board[coord.x + 1][coord.y]) {
      // cell directly underneath is null / open
      validMatrix[2][1] = true;

      // bottom right
      if (coord.y + 1 < 9) {
        if (!board[coord.x + 1][coord.y + 1]) {
          validMatrix[2][2] = true;
        } else {
          return false;
        }
      }
    } else {
      return false;
    }

    if (coord.y == 9) {
      //right line clear
      validMatrix[0][2] = true;
      validMatrix[1][2] = true;
      validMatrix[2][2] = true;
    } else if (!board[coord.x][coord.y + 1]) {
      // cell directly to the right is null / open
      validMatrix[1][2] = true;

      // top right
      if (coord.x - 1 > 0) {
        if (!board[coord.x - 1][coord.y + 1]) {
          validMatrix[0][2] = true;
        } else {
          return false;
        }
      }
    } else {
      return false;
    }

    return true;
  };

  const placeShip = (ship, coordArr = null) => {
    if (!coordArr) {
      coordArr = getRandomCoords(ship.length, board);
    }
    ship.location = coordArr;
    coordArr.forEach((coord) => {
      board[coord.x][coord.y] = ship;
    });
  };

  // coords object is { x: num, y: num }
  const receiveAttack = (coord) => {
    if (board[coord.x][coord.y]) {
      // a ship is in this location
      board[coord.x][coord.y].hit(coord);
      return true;
    } else {
      missedShots.push(coord);
      return false;
    }
  };

  const checkSunkShips = () => {
    return ships.every((ship) => {
      return ship.isSunk();
    });
  };

  return {
    ships,
    board,
    missedShots,
    placeShip,
    receiveAttack,
    checkSunkShips,
    eraseBoard,
  };
};
