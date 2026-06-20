import { Gameboard } from "../models/gameboard";

let gameboard;

beforeEach(() => {
  gameboard = Gameboard();
});

test("gameboard is initially a 10x10 grid full of null values", () => {
  expect(gameboard.board).toEqual(
    Array.from({ length: 10 }, () => Array(10).fill(null)),
  );
});

test("place ship on player's gameboard", () => {
  gameboard.placeShip(gameboard.ships[4], [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
  expect(gameboard.board[0][0]).toEqual(gameboard.ships[4]);
});

test("missed shot is added to missedShots array", () => {
  gameboard.placeShip(gameboard.ships[4], [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
  gameboard.receiveAttack({ x: 2, y: 2 });
  expect(gameboard.missedShots).toEqual([{ x: 2, y: 2 }]);
});

test("attack received by gameboard hits ship", () => {
  gameboard.placeShip(gameboard.ships[4], [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
  gameboard.receiveAttack({ x: 1, y: 0 });
  expect(gameboard.ships[4].timesHit).toBe(1);
});

test("board is properly erased", () => {
  gameboard.placeShip(gameboard.ships[4], [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
  gameboard.eraseBoard();
  expect(gameboard.board[0][0]).toBeNull();
});

test("check that every ship is sunk", () => {
  gameboard.ships.forEach((ship) => {
    gameboard.placeShip(ship);
  });

  gameboard.ships.forEach((ship) => {
    for (let i = 0; i < ship.length; i++) {
      ship.hit(ship.location[i]);
    }
  });
  expect(gameboard.checkSunkShips()).toBe(true);
});
