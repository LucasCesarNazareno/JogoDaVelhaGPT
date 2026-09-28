"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const G = require("../script.js");
const DRAW = ["X", "O", "X", "X", "O", "O", "O", "X", "X"];

function claim(game, index, player) {
  game.boards[index] = { cells: [player, player, player, null, null, null, null, null, null], status: player };
}

test("X começa e todas as 81 casas estão disponíveis", () => {
  const game = G.createGame();
  assert.equal(game.player, "X");
  assert.equal(game.forcedBoard, null);
  for (let board = 0; board < 9; board++) for (let cell = 0; cell < 9; cell++) {
    assert.equal(G.canPlay(game, board, cell), true);
  }
  assert.deepEqual(G.KEYPAD, [7, 8, 9, 4, 5, 6, 1, 2, 3]);
});

test("exemplo: tabuleiro 3/casa 7 envia O ao 7; casa 2 envia X ao 2", () => {
  const game = G.createGame();
  assert.equal(G.playMove(game, 8, 0), true);
  assert.equal(game.player, "O");
  assert.equal(G.KEYPAD[game.forcedBoard], 7);
  assert.equal(G.playMove(game, 0, 7), true);
  assert.equal(game.player, "X");
  assert.equal(G.KEYPAD[game.forcedBoard], 2);
});

test("tabuleiro errado, casa ocupada e índices inválidos não alteram o estado", () => {
  const game = G.createGame();
  G.playMove(game, 0, 0);
  const before = structuredClone(game);
  for (const [board, cell] of [[1, 0], [0, 0], [-1, 0], [9, 0], [0, 9], [0, -1], [0, 1.5], [NaN, 1]]) {
    assert.equal(G.playMove(game, board, cell), false);
    assert.deepEqual(game, before);
  }
});

for (const player of ["X", "O"]) for (const [index, line] of G.LINES.entries()) {
  test(`${player} conquista um tabuleiro na sequência ${index + 1}`, () => {
    const game = G.createGame();
    game.player = player;
    game.boards[4].cells[line[0]] = player;
    game.boards[4].cells[line[1]] = player;
    assert.equal(G.playMove(game, 4, line[2]), true);
    assert.equal(game.boards[4].status, player);
    for (let cell = 0; cell < 9; cell++) assert.equal(G.canPlay(game, 4, cell), false);
  });
}

test("envio para um tabuleiro conquistado libera todos os tabuleiros abertos", () => {
  const game = G.createGame();
  claim(game, 0, "O");
  G.playMove(game, 4, 0);
  assert.equal(game.forcedBoard, null);
  assert.equal(G.isBoardAvailable(game, 0), false);
  for (let board = 1; board < 9; board++) assert.equal(G.isBoardAvailable(game, board), true);
});

test("envio para tabuleiro empatado também libera a escolha", () => {
  const game = G.createGame();
  game.boards[7] = { cells: [...DRAW], status: "draw" };
  G.playMove(game, 4, 7);
  assert.equal(game.forcedBoard, null);
  assert.equal(G.isBoardAvailable(game, 7), false);
  assert.equal(G.isBoardAvailable(game, 1), true);
});

test("conquistar o próprio destino libera a próxima jogada", () => {
  const game = G.createGame();
  game.boards[2].cells = ["X", "X", null, null, null, null, null, null, null];
  G.playMove(game, 2, 2);
  assert.equal(game.boards[2].status, "X");
  assert.equal(game.forcedBoard, null);
});

test("nona casa sem vitória fecha o tabuleiro como empate", () => {
  const game = G.createGame();
  game.boards[8].cells = [...DRAW];
  game.boards[8].cells[8] = null;
  G.playMove(game, 8, 8);
  assert.equal(game.boards[8].status, "draw");
  assert.equal(game.forcedBoard, null);
  assert.equal(game.outcome, null);
});

test("vitória na nona casa tem prioridade sobre empate", () => {
  assert.equal(G.getBoardStatus(["X", "O", "X", "O", "X", "O", "O", "X", "X"]), "X");
});

for (const player of ["X", "O"]) for (const [index, line] of G.LINES.entries()) {
  test(`${player} vence o tabuleiro principal na sequência ${index + 1}`, () => {
    const game = G.createGame();
    game.player = player;
    claim(game, line[0], player);
    claim(game, line[1], player);
    game.boards[line[2]].cells[0] = player;
    game.boards[line[2]].cells[1] = player;
    G.playMove(game, line[2], 2);
    assert.equal(game.outcome, player);
    assert.deepEqual(game.winningLine, line);
    const before = structuredClone(game);
    for (let board = 0; board < 9; board++) for (let cell = 0; cell < 9; cell++) {
      assert.equal(G.playMove(game, board, cell), false);
    }
    assert.deepEqual(game, before);
  });
}

test("três empates em linha não são uma vitória", () => {
  const game = G.createGame();
  for (const index of [0, 1, 2]) game.boards[index] = { cells: [...DRAW], status: "draw" };
  assert.equal(G.getMainResult(game.boards).outcome, null);
});

test("empate geral ao fechar o último tabuleiro sem vencedor", () => {
  const game = G.createGame();
  game.boards = Array.from({ length: 9 }, () => ({ cells: [...DRAW], status: "draw" }));
  game.boards[8].status = null;
  game.boards[8].cells[8] = null;
  game.forcedBoard = 8;
  G.playMove(game, 8, 8);
  assert.equal(game.outcome, "draw");
  assert.deepEqual(game.winningLine, []);
  assert.equal(G.playMove(game, 0, 0), false);
});

test("empate geral com tabuleiros conquistados e casas ainda vazias", () => {
  const game = G.createGame();
  DRAW.forEach((owner, index) => claim(game, index, owner));
  game.boards[8].status = null;
  game.boards[8].cells[2] = null;
  G.playMove(game, 8, 2);
  assert.equal(game.outcome, "draw");
});

test("vitória principal na última conquista tem prioridade sobre empate", () => {
  const game = G.createGame();
  game.boards = Array.from({ length: 9 }, () => ({ cells: [...DRAW], status: "draw" }));
  claim(game, 0, "X");
  claim(game, 1, "X");
  game.boards[2] = { cells: ["X", "X", null, null, null, null, null, null, null], status: null };
  G.playMove(game, 2, 2);
  assert.equal(game.outcome, "X");
});

test("reinício retorna X, 81 casas vazias, escolha livre e nenhum resultado", () => {
  let game = G.createGame();
  G.playMove(game, 4, 4);
  const old = game;
  game = G.createGame();
  assert.equal(game.moves, 0);
  assert.equal(game.player, "X");
  assert.equal(game.forcedBoard, null);
  assert.equal(game.outcome, null);
  assert.equal(game.lastMove, null);
  assert.ok(game.boards.every(board => board.status === null && board.cells.every(cell => cell === null)));
  assert.equal(old.boards[4].cells[4], "X");
  game.boards[0].cells[0] = "X";
  assert.equal(game.boards[1].cells[0], null);
});

test("300 partidas completas respeitam turnos, destinos e encerramento", () => {
  let seed = 20260928;
  function random(max) {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return Math.floor(seed / 4294967296 * max);
  }
  const results = { X: 0, O: 0, draw: 0 };
  for (let run = 0; run < 300; run++) {
    const game = G.createGame();
    while (!game.outcome) {
      const legal = [];
      for (let board = 0; board < 9; board++) for (let cell = 0; cell < 9; cell++) {
        if (G.canPlay(game, board, cell)) legal.push([board, cell]);
      }
      assert.ok(legal.length > 0);
      const [boardIndex, cellIndex] = legal[random(legal.length)];
      const player = game.player;
      const before = structuredClone(game);
      assert.equal(G.playMove(game, boardIndex, cellIndex), true);
      assert.equal(game.boards[boardIndex].cells[cellIndex], player);
      assert.equal(game.moves, before.moves + 1);
      assert.ok(game.moves <= 81);
      for (let board = 0; board < 9; board++) {
        assert.equal(game.boards[board].status, G.getBoardStatus(game.boards[board].cells));
        if (board !== boardIndex) assert.deepEqual(game.boards[board], before.boards[board]);
      }
      if (!game.outcome) {
        assert.equal(game.player, G.nextPlayer(player));
        assert.equal(game.forcedBoard, game.boards[cellIndex].status ? null : cellIndex);
      }
    }
    results[game.outcome]++;
  }
  assert.ok(results.X > 0 && results.O > 0 && results.draw > 0);
});
