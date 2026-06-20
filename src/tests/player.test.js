import { Player } from "../models/player";

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
