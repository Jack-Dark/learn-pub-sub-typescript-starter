import amqp from "amqplib";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilDirect, PauseKey, QuitKey, ResumeKey } from "../internal/routing/routing.js";
import { getInput, printServerHelp } from "../internal/gamelogic/gamelogic.js";

async function main() {
  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);
  console.log("Peril game server connected to RabbitMQ!");

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

  const publishCh = await conn.createConfirmChannel();


  printServerHelp()

  while (true) {
    const [command] = await getInput('Enter command: ');
    if (!command) {
      continue;
    }
    if (command === PauseKey) {
      console.log(`Publishing "${PauseKey}" game state...`);

      try {
        await publishJSON(publishCh, ExchangePerilDirect, PauseKey, {
          isPaused: true,
        });
      } catch (err) {
        console.error("Error publishing message:", err);
      }
    } else if (command === ResumeKey) {
      console.log(`Publishing "${ResumeKey}" game state...`);

      try {
        await publishJSON(publishCh, ExchangePerilDirect, PauseKey, {
          isPaused: false,
        });
      } catch (err) {
        console.error("Error publishing message:", err);
      }
    } else if (command === QuitKey) {
      console.log(`Goodbye!`);
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
