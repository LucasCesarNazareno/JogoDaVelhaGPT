"use strict";

const UltimateGame = (() => {
  // Row-major indices keep both board levels aligned with the numeric keypad.
  const KEYPAD = [7, 8, 9, 4, 5, 6, 1, 2, 3];
  const LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  function createGame() {
    return {
      boards: Array.from({ length: 9 }, () => ({ cells: Array(9).fill(null), status: null })),
      player: "X",
      forcedBoard: null,
      outcome: null,
      winningLine: [],
      moves: 0,
      lastMove: null
    };
  }

  function findWinningLine(cells) {
    return LINES.find(line => {
      const player = cells[line[0]];
      return (player === "X" || player === "O") && line.every(index => cells[index] === player);
    }) || null;
  }

  function getBoardStatus(cells) {
    const line = findWinningLine(cells);
    if (line) return cells[line[0]];
    return cells.every(Boolean) ? "draw" : null;
  }

  function isBoardOpen(board) {
    return board.status === null && board.cells.some(cell => cell === null);
  }

  function isBoardAvailable(game, boardIndex) {
    if (!Number.isInteger(boardIndex) || boardIndex < 0 || boardIndex > 8 || game.outcome) return false;
    return isBoardOpen(game.boards[boardIndex]) && (game.forcedBoard === null || game.forcedBoard === boardIndex);
  }

  function canPlay(game, boardIndex, cellIndex) {
    return Number.isInteger(cellIndex) && cellIndex >= 0 && cellIndex < 9 &&
      isBoardAvailable(game, boardIndex) && game.boards[boardIndex].cells[cellIndex] === null;
  }

  function getMainResult(boards) {
    const owners = boards.map(board => board.status);
    const line = findWinningLine(owners);
    if (line) return { outcome: owners[line[0]], winningLine: [...line] };
    return { outcome: boards.every(board => !isBoardOpen(board)) ? "draw" : null, winningLine: [] };
  }

  function nextPlayer(player) {
    return player === "X" ? "O" : "X";
  }

  function playMove(game, boardIndex, cellIndex) {
    if (!canPlay(game, boardIndex, cellIndex)) return false;
    const board = game.boards[boardIndex];
    board.cells[cellIndex] = game.player;
    board.status = getBoardStatus(board.cells);
    game.moves += 1;
    game.lastMove = { boardIndex, cellIndex, closedBoard: board.status !== null };
    Object.assign(game, getMainResult(game.boards));

    // Resolve the destination after claiming the current board, including a self-send.
    game.forcedBoard = !game.outcome && isBoardOpen(game.boards[cellIndex]) ? cellIndex : null;
    if (!game.outcome) game.player = nextPlayer(game.player);
    return true;
  }

  return { KEYPAD, LINES, createGame, findWinningLine, getBoardStatus, isBoardAvailable, canPlay, getMainResult, nextPlayer, playMove };
})();

if (typeof module !== "undefined" && module.exports) module.exports = UltimateGame;
if (typeof document !== "undefined") initializeInterface();

function initializeInterface() {
  const { KEYPAD, createGame, isBoardAvailable, canPlay, playMove } = UltimateGame;
  const byId = id => document.getElementById(id);
  const boardElement = byId("ultimate-board");
  const resultDialog = byId("result-dialog");
  const helpDialog = byId("help-dialog");
  const scoreKey = "ultimate-tic-tac-toe.scores.v1";
  let game = createGame();
  let scores = readScores();
  const boardViews = [];

  function readScores() {
    const empty = { X: 0, O: 0, draw: 0 };
    try {
      const saved = JSON.parse(localStorage.getItem(scoreKey));
      if (saved) for (const key of Object.keys(empty)) {
        if (Number.isSafeInteger(saved[key]) && saved[key] >= 0) empty[key] = saved[key];
      }
    } catch { /* The game also works when browser storage is unavailable. */ }
    return empty;
  }

  function saveScores() {
    try { localStorage.setItem(scoreKey, JSON.stringify(scores)); }
    catch { /* Keep the current session's score if persistent storage is blocked. */ }
  }

  function buildBoard() {
    KEYPAD.forEach((number, boardIndex) => {
      const section = document.createElement("section");
      section.className = "mini-board";
      section.setAttribute("aria-label", `Tabuleiro ${number}`);
      section.innerHTML = `<div class="mini-heading" aria-hidden="true"><span>${number}</span><span class="board-dot"></span></div><div class="cells"></div><div class="board-result" hidden><span class="big-mark"></span><span class="claim-label"></span></div>`;
      const cells = KEYPAD.map((cellNumber, cellIndex) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "cell";
        button.dataset.board = boardIndex;
        button.dataset.cell = cellIndex;
        button.innerHTML = `<span class="cell-number" aria-hidden="true">${cellNumber}</span><span class="symbol" aria-hidden="true"></span>`;
        button.addEventListener("click", event => handleMove(boardIndex, cellIndex, event.detail === 0));
        section.querySelector(".cells").append(button);
        return button;
      });
      boardViews.push({ section, cells, result: section.querySelector(".board-result") });
      boardElement.append(section);
    });
  }

  function handleMove(boardIndex, cellIndex, fromKeyboard) {
    if (!playMove(game, boardIndex, cellIndex)) return;
    if (game.outcome) {
      scores[game.outcome] += 1;
      saveScores();
    }
    render();
    if (game.outcome) showResult();
    else if (fromKeyboard) boardElement.querySelector(".cell:not(:disabled)")?.focus({ preventScroll: true });
  }

  function render() {
    const accentPlayer = game.outcome === "X" || game.outcome === "O" ? game.outcome : game.player;
    document.documentElement.style.setProperty("--accent", accentPlayer === "X" ? "var(--x)" : "var(--o)");
    document.documentElement.style.setProperty("--accent-rgb", accentPlayer === "X" ? "243,148,121" : "131,191,206");

    game.boards.forEach((board, boardIndex) => {
      const view = boardViews[boardIndex];
      const available = isBoardAvailable(game, boardIndex);
      const closed = board.status !== null;
      const newlyClosed = game.lastMove?.boardIndex === boardIndex && game.lastMove.closedBoard;
      view.section.className = `mini-board ${available ? "available" : "unavailable"}${closed ? " closed" : ""}${newlyClosed ? " newly-closed" : ""}${game.winningLine.includes(boardIndex) ? " macro-win" : ""}`;
      const statusLabel = closed ? (board.status === "draw" ? "empatado" : `conquistado por ${board.status}`) : (available ? "disponível" : "indisponível");
      view.section.setAttribute("aria-label", `Tabuleiro ${KEYPAD[boardIndex]}, ${statusLabel}`);
      view.cells.forEach((button, cellIndex) => {
        const mark = board.cells[cellIndex];
        const justPlayed = game.lastMove?.boardIndex === boardIndex && game.lastMove.cellIndex === cellIndex;
        button.disabled = !canPlay(game, boardIndex, cellIndex);
        button.className = `cell${mark ? ` occupied mark-${mark.toLowerCase()}` : ""}${justPlayed ? " just-played" : ""}`;
        button.dataset.preview = game.player;
        button.querySelector(".symbol").textContent = mark || "";
        button.querySelector(".cell-number").hidden = Boolean(mark);
        button.setAttribute("aria-label", `Tabuleiro ${KEYPAD[boardIndex]}, casa ${KEYPAD[cellIndex]}${mark ? `, ${mark}` : ", vazia"}`);
      });
      view.result.hidden = !closed;
      view.result.className = `board-result ${board.status === "draw" ? "is-draw" : board.status ? `mark-${board.status.toLowerCase()}` : ""}`;
      view.result.querySelector(".big-mark").textContent = board.status === "draw" ? "—" : board.status || "";
      view.result.querySelector(".claim-label").textContent = board.status === "draw" ? "EMPATE" : "CONQUISTADO";
    });
    renderStatus();
    byId("score-x").textContent = scores.X;
    byId("score-o").textContent = scores.O;
    byId("score-draw").textContent = scores.draw;
  }

  function renderStatus() {
    const ended = Boolean(game.outcome);
    byId("board-caption").textContent = ended ? "PARTIDA ENCERRADA" : "PARTIDA EM ANDAMENTO";
    byId("move-count").textContent = ended ? `${game.moves} JOGADAS` : `JOGADA ${String(game.moves + 1).padStart(2, "0")}`;
    byId("turn-heading").textContent = ended ? "RESULTADO FINAL" : "A VEZ É DE";
    const symbol = ended ? (game.outcome === "draw" ? "—" : game.outcome) : game.player;
    byId("turn-symbol").textContent = symbol;
    byId("turn-symbol").className = `player-tile ${symbol === "X" ? "mark-x" : symbol === "O" ? "mark-o" : ""}`;
    byId("turn-player").textContent = ended ? (game.outcome === "draw" ? "Deu empate!" : `Jogador ${game.outcome} venceu!`) : `Jogador ${game.player}`;
    byId("turn-subtitle").textContent = ended ? "Que tal mais uma partida?" : game.moves === 0 ? "Pode começar a partida" : "Pense no próximo destino";
    byId("destination-icon").textContent = ended ? "✓" : game.forcedBoard === null ? "↗" : KEYPAD[game.forcedBoard];
    byId("destination-title").textContent = ended ? "Partida encerrada" : game.forcedBoard === null ? "Escolha livre" : `Jogue no tabuleiro ${KEYPAD[game.forcedBoard]}`;
    byId("destination-description").textContent = ended
      ? (game.outcome === "draw" ? "Todos os tabuleiros fecharam sem uma sequência vencedora." : `Jogador ${game.outcome} conquistou três tabuleiros em sequência.`)
      : `${game.player}: ${game.forcedBoard === null ? (game.moves === 0 ? "jogue em qualquer tabuleiro disponível." : "o destino está fechado. Escolha qualquer tabuleiro disponível.") : "escolha uma casa vazia no tabuleiro destacado."}`;
  }

  function showResult() {
    const draw = game.outcome === "draw";
    byId("result-emblem").textContent = draw ? "=" : game.outcome;
    byId("result-title").textContent = draw ? "A partida empatou!" : `Jogador ${game.outcome} venceu!`;
    byId("result-description").textContent = draw ? "Todos os tabuleiros foram fechados. A próxima disputa começa do zero." : "Três tabuleiros conquistados em sequência. Uma grande vitória.";
    resultDialog.showModal();
  }

  function restartGame() {
    resultDialog.close();
    game = createGame();
    render();
  }

  byId("restart-button").addEventListener("click", restartGame);
  byId("play-again-button").addEventListener("click", () => {
    restartGame();
    boardViews[0].cells[0].focus({ preventScroll: true });
  });
  byId("view-board-button").addEventListener("click", () => resultDialog.close());
  byId("help-button").addEventListener("click", () => helpDialog.showModal());
  byId("close-help-button").addEventListener("click", () => helpDialog.close());
  byId("understood-button").addEventListener("click", () => helpDialog.close());
  buildBoard();
  render();
}
