import { Player, Gameboard, Ship } from "./factories";

test("get correct player type", () => {
  let p1 = Player("real");
  expect(p1.type).toBe("real");
});

test("get correct player type", () => {
  let p2 = Player("computer");
  expect(p2.type).toBe("computer");
});

test("player's gameboard properly initialized", () => {
  let p1 = Player("real");
  expect(p1.gameboard).toBeDefined();
});

test("player's gameboard is initially a 10x10 grid full of null values", () => {
  let p1 = Player("real");
  expect(p1.gameboard.board).toEqual(
    Array.from({ length: 10 }, () => Array(10).fill(null)),
  );
});

test("ship length", () => {
  let ship = Ship(5, "carrier");
  expect(ship.length).toBe(5);
});

test("ship name", () => {
  let ship = Ship(4, "battleship");
  expect(ship.name).toBe("battleship");
});

test("get ship location, pre-placed on gameboard", () => {
  let ship = Ship(3, "destroyer");
  expect(ship.location).toEqual([null, null, null]);
});

test("place ship on player's gameboard", () => {
  let p1 = Player("real");
  let ship = Ship(2, "patrol boat");
  p1.gameboard.placeShip(ship, [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
  expect(p1.gameboard.board[0][0]).toEqual(ship);
});

test("get ship's location after placing ship on player's gameboard", () => {
  let p1 = Player("real");
  let ship = Ship(2, "patrol boat");
  p1.gameboard.placeShip(ship, [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
  expect(ship.location).toEqual([
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
});

test("hit a ship at a certain coordinate", () => {
  let p1 = Player("real");
  let ship = Ship(2, "patrol boat");
  p1.gameboard.placeShip(ship, [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
  ship.hit({ x: 0, y: 0 });
  expect(ship.timesHit).toBe(1);
});

test("ship coordinate added to hit array after hitting ship", () => {
  let p1 = Player("real");
  let ship = Ship(2, "patrol boat");
  p1.gameboard.placeShip(ship, [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
  ship.hit({ x: 0, y: 0 });
  expect(ship.hits).toEqual([{ x: 0, y: 0 }]);
});

test("cannot hit ship at same spot twice", () => {
  let p1 = Player("real");
  let ship = Ship(2, "patrol boat");
  p1.gameboard.placeShip(ship, [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
  ship.hit({ x: 0, y: 0 });
  ship.hit({ x: 0, y: 0 });
  expect(ship.hits).toEqual([{ x: 0, y: 0 }]);
});

test("cannot hit ship again if already sunk", () => {
  let p1 = Player("real");
  let ship = Ship(2, "patrol boat");
  p1.gameboard.placeShip(ship, [
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
  let p1 = Player("real");
  let ship = Ship(2, "patrol boat");
  p1.gameboard.placeShip(ship, [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
  ship.hit({ x: 0, y: 0 });
  ship.hit({ x: 1, y: 0 });
  expect(ship.isSunk()).toBe(true);
});

test("missed shot is added to missedShots array", () => {
  let p1 = Player("real");
  let ship = Ship(2, "patrol boat");
  p1.gameboard.placeShip(ship, [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
  p1.gameboard.receiveAttack({ x: 2, y: 2 });
  expect(p1.gameboard.missedShots).toEqual([{ x: 2, y: 2 }]);
});

test("attack received by gameboard hits ship", () => {
  let p1 = Player("real");
  let ship = Ship(2, "patrol boat");
  p1.gameboard.placeShip(ship, [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
  p1.gameboard.receiveAttack({ x: 1, y: 0 });
  expect(ship.timesHit).toBe(1);
});

test("board is properly erased", () => {
  let p1 = Player("real");
  let ship = Ship(2, "patrol boat");
  p1.gameboard.placeShip(ship, [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
  p1.gameboard.eraseBoard();
  expect(p1.gameboard.board[0][0]).toBeNull();
});

test("check that every ship is sunk", () => {
  let p1 = Player("real");
  p1.gameboard.ships.forEach((ship) => {
    p1.gameboard.placeShip(ship);
  });

  p1.gameboard.ships.forEach((ship) => {
    for (let i = 0; i < ship.length; i++) {
      ship.hit(ship.location[i]);
    }
  });
  expect(p1.gameboard.checkSunkShips()).toBe(true);
});
