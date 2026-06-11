export const Ship = ({ length, timesHit = 0, sunk = false }) => {
  return {
    length,
    timesHit,
    sunk,
    location: Array({ length: length }).fill(null),
    hit: () => {
      timesHit++;
    },
    isSunk: () => {
      if (timesHit >= length) {
        sunk = true;
        return true;
      }
      return false;
    },
  };
};

export const Gameboard = () => {
  let board = Array.from({ length: 10 }, () => Array(10).fill(null));
  return {
    board,
    missedShots: [],
    placeShip: (ship, coordArr) => {
      ship.location = coordArr;
      coordArr.forEach((coord) => {
        board[coord.x][coord.y] = ship;
      });
    },
    // coords object is { x: num, y: num }
    receiveAttack: (coords) => {
      board[coords.x][coords.y]
        ? board[coords.x][coords.y].hit()
        : missedShots.push(coords);
    },
  };
};

export const Player = ({ type }) => {
  return {
    type,
    gameboard: Gameboard(),
  };
};

let player = Player({ type: "real" });
console.log(player.gameboard.board);
player.gameboard.placeShip(Ship({ length: 3 }), [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
]);
console.log(player.gameboard.board);
