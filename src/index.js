import "./styles.scss";
import { Player, Gameboard, Ship } from "./factories.js";

//IIFE
const DOMManager = (() => {
  const createTables = () => {
    const ctn = document.querySelectorAll(".battleship-ctn");

    ctn.forEach((c) => {
      const table = document.createElement("table");
      table.classList.add("battleship-table");

      // create cells in table
      for (let i = 0; i < 10; i++) {
        const tr = table.insertRow();

        for (let j = 0; j < 10; j++) {
          const td = tr.insertCell();
          td.classList.add("battleship-table__cell");
        }
      }

      c.appendChild(table);
    });
  };

  return {
    createTables,
  };
})();

DOMManager.createTables();
