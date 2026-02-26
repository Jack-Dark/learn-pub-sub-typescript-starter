import type { ConfirmChannel } from "amqplib";
import type { ArmyMove, RecognitionOfWar } from "../internal/gamelogic/gamedata.js";
import type { GameState, PlayingState } from "../internal/gamelogic/gamestate.js";
import { handleMove, MoveOutcome } from "../internal/gamelogic/move.js";
import { handlePause } from "../internal/gamelogic/pause.js";
import { AckType } from "../internal/pubsub/consume.js";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilTopic, WarRecognitionsPrefix } from "../internal/routing/routing.js";
import { handleWar, WarOutcome } from "../internal/gamelogic/war.js";

export function handlerPause(gs: GameState) {
  return function (ps: PlayingState) {
    handlePause(gs, ps);
    process.stdout.write("> ");
    return AckType.Ack
  }
}

export function handlerMove(gs: GameState,
  publishCh: ConfirmChannel) {
  return async (
    move: ArmyMove,
  ): Promise<AckType> => {
    try {
      const outcome = handleMove(gs, move);
      switch (outcome) {
        case MoveOutcome.Safe:
          return AckType.Ack;
        case MoveOutcome.MakeWar: {
          if (outcome === MoveOutcome.MakeWar) {
            const defender = gs.getPlayerSnap();
            const rw: RecognitionOfWar = {
              attacker: move.player,
              defender,
            };

            await publishJSON(
              publishCh,
              ExchangePerilTopic,
              `${WarRecognitionsPrefix}.${defender.username}`,
              rw
            );
          }
          return AckType.NackRequeue;

        }
        default:
          return AckType.NackDiscard;
      }
    } finally {
      process.stdout.write("> ");
    }
  };
}

export function handlerWar(gs: GameState) {
  return (rw: RecognitionOfWar): AckType => {
    try {
      const resolution = handleWar(gs, rw);
      switch (resolution.result) {
        case WarOutcome.NotInvolved:
          return AckType.NackRequeue;

        case WarOutcome.NoUnits:
          return AckType.NackDiscard;

        case WarOutcome.OpponentWon:
        case WarOutcome.YouWon:
        case WarOutcome.Draw:
          return AckType.Ack;

        default:
          console.log(`Error: Unknown war outcome`);
          return AckType.NackDiscard;
      }
    } finally {
      process.stdout.write("> ");
    }
  }
}