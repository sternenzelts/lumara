import type { Game } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { applyAction, createState, playerView, type Action, type GameState } from './engine';
export * from './engine';

export const LumaraGame: Game<GameState> = {
  name: 'lumara-last-light', minPlayers: 2, maxPlayers: 10, disableUndo: true,
  setup: ({ ctx }, setupData) => createState(ctx.numPlayers, setupData?.edition === 'original' ? 'original' : 'party'),
  validateSetupData: (setupData, players) => setupData?.edition === 'original' && players > 5 ? 'Original supports 2–5 players.' : undefined,
  playerView: ({ G, playerID }) => playerView(G, playerID),
  turn: { activePlayers: { all: 'act' }, stages: { act: { moves: {
    act: { client: false, redact: true, move: ({ G, playerID, random }, action: Action) => {
      if (!playerID || !action || typeof action !== 'object') return INVALID_MOVE;
      return applyAction(G, Number(playerID), action, { shuffle: cards => random!.Shuffle(cards), number: () => random!.Number() }) ? undefined : INVALID_MOVE;
    } },
  } } } },
  endIf: ({ G }) => G.winner !== null ? { winner: String(G.winner) } : undefined,
};
