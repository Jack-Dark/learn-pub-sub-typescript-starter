import type { GameState, PlayingState } from "../internal/gamelogic/gamestate.js";
import { handlePause } from "../internal/gamelogic/pause.js";

export function handlerPause(gs: GameState) {
  return function (ps: PlayingState) {
    handlePause(gs, ps);
    console.log('> ');
  }
}