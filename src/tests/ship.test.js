import { Ship } from "../models/ship";
import { Gameboard } from "../models/gameboard";

let gameboard;

beforeEach(() => {
  gameboard = Gameboard();
});

test("create ship with proper length", () => {
  let ship = Ship(5, "carrier");
  expect(ship.length).toBe(5);
});

test("create ship with correct name", () => {
  let ship = Ship(4, "battleship");
  expect(ship.name).toBe("battleship");
});

test("get ship location, pre-placed on gameboard", () => {
  let ship = Ship(3, "destroyer");
  expect(ship.location).toEqual([null, null, null]);
});

test("get ship's location after placing ship on player's gameboard", () => {
  let ship = Ship(2, "patrol boat");
  gameboard.placeShip(ship, [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
  expect(ship.location).toEqual([
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
});

test("hit a ship at a certain coordinate", () => {
  let ship = Ship(2, "patrol boat");
  gameboard.placeShip(ship, [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
  ship.hit({ x: 0, y: 0 });
  expect(ship.timesHit).toBe(1);
});

test("ship coordinate added to hit array after hitting ship", () => {
  let ship = Ship(2, "patrol boat");
  gameboard.placeShip(ship, [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
  ship.hit({ x: 0, y: 0 });
  expect(ship.hits).toEqual([{ x: 0, y: 0 }]);
});

test("cannot hit ship at same spot twice", () => {
  let ship = Ship(2, "patrol boat");
  gameboard.placeShip(ship, [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
  ship.hit({ x: 0, y: 0 });
  ship.hit({ x: 0, y: 0 });
  expect(ship.hits).toEqual([{ x: 0, y: 0 }]);
});

test("cannot hit ship again if already sunk", () => {
  let ship = Ship(2, "patrol boat");
  gameboard.placeShip(ship, [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
  ship.hit({ x: 0, y: 0 });
  ship.hit({ x: 1, y: 0 });
  ship.hit({ x: 1, y: 0 });
  expect(ship.hits).toEqual([
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
});

test("ship is properly sunk", () => {
  let ship = Ship(2, "patrol boat");
  gameboard.placeShip(ship, [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
  ship.hit({ x: 0, y: 0 });
  ship.hit({ x: 1, y: 0 });
  expect(ship.isSunk()).toBe(true);
});
