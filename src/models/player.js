import { Gameboard } from "./gameboard.js";

export const Player = (type) => {
  return {
    type,
    gameboard: Gameboard(),
  };
};
