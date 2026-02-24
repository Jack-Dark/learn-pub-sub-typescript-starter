import amqp from "amqplib";
import { clientWelcome, commandStatus, getInput, printClientHelp, printQuit } from "../internal/gamelogic/gamelogic.js";
import { declareAndBind, SimpleQueueType, subscribeJSON } from "../internal/pubsub/consume.js";
import { COMMAND_TYPES, ExchangePerilDirect } from "../internal/routing/routing.js";
import { GameState } from "../internal/gamelogic/gamestate.js";
import { commandSpawn } from "../internal/gamelogic/spawn.js";
import { commandMove } from "../internal/gamelogic/move.js";
import { handlerPause } from "./handlers.js";

async function main() {
  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);
  console.log("Peril game client connected to RabbitMQ!");

  ["SIGINT", "SIGTERM"].forEach((signal) =>
    process.on(signal, async () => {
      try {
        await conn.close();
        console.log("RabbitMQ connection closed.");
      } catch (err) {
        console.error("Error closing RabbitMQ connection:", err);
      } finally {
        process.exit(0);
      }
    }),
  );

  const username = await clientWelcome();

  await declareAndBind(
    conn,
    ExchangePerilDirect,
    `${COMMAND_TYPES.pause}.${username}`,
    COMMAND_TYPES.pause,
    SimpleQueueType.Transient,
  );

  const gs = new GameState(username)

  subscribeJSON(
    conn,
    ExchangePerilDirect,
    `${COMMAND_TYPES.pause}.${username}`,
    COMMAND_TYPES.pause,
    SimpleQueueType.Transient,
    handlerPause(gs),
  );

  while (true) {
    const words = await getInput('Enter command: ');
    const [command] = words;

    if (command === COMMAND_TYPES.spawn) {
      try {
        commandSpawn(gs, words);
      } catch (err) {
        console.log((err as Error).message);
      }
    } else if (command === COMMAND_TYPES.move) {
      try {
        commandMove(gs, words);
      } catch (err) {
        console.log((err as Error).message);
      }
    } else if (command === COMMAND_TYPES.status) {
      commandStatus(gs);
    } else if (command === COMMAND_TYPES.help) {
      printClientHelp();
    } else if (command === COMMAND_TYPES.spam) {
      console.log("Spamming not allowed yet!")
    } else if (command === COMMAND_TYPES.quit) {
      printQuit();
      process.exit(0)
    } else {
      console.log("Unknown command")
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
