import amqp from 'amqplib';
import { publishJSON } from '../internal/pubsub/publish.js';
import {
  COMMAND_TYPES,
  ExchangePerilDirect,
  ExchangePerilTopic,
  GameLogSlug,
} from '../internal/routing/routing.js';
import { getInput, printServerHelp } from '../internal/gamelogic/gamelogic.js';
import {
  SimpleQueueType,
  subscribeMsgPack,
} from '../internal/pubsub/consume.js';
import { handlerLog } from './handlers.js';

async function main() {
  const rabbitConnString = 'amqp://guest:guest@localhost:5672/';
  const conn = await amqp.connect(rabbitConnString);
  console.log('Peril game server connected to RabbitMQ!');

  ['SIGINT', 'SIGTERM'].forEach((signal) =>
    process.on(signal, async () => {
      try {
        await conn.close();
        console.log('RabbitMQ connection closed.');
      } catch (err) {
        console.error('Error closing RabbitMQ connection:', err);
      } finally {
        process.exit(0);
      }
    }),
  );

  const publishCh = await conn.createConfirmChannel();

  await subscribeMsgPack(
    conn,
    ExchangePerilTopic,
    GameLogSlug,
    `${GameLogSlug}.*`,
    SimpleQueueType.Durable,
    handlerLog(),
  );

  printServerHelp();

  while (true) {
    const words = await getInput('Enter command: ');
    const [command] = words;
    if (!command) {
      continue;
    }
    if (command === COMMAND_TYPES.pause) {
      console.log(`Publishing "${COMMAND_TYPES.pause}" game state...`);

      try {
        await publishJSON(publishCh, ExchangePerilDirect, COMMAND_TYPES.pause, {
          isPaused: true,
        });
      } catch (err) {
        console.error('Error publishing message:', err);
      }
    } else if (command === COMMAND_TYPES.resume) {
      console.log(`Publishing "${COMMAND_TYPES.resume}" game state...`);

      try {
        await publishJSON(publishCh, ExchangePerilDirect, COMMAND_TYPES.pause, {
          isPaused: false,
        });
      } catch (err) {
        console.error('Error publishing message:', err);
      }
    } else if (command === COMMAND_TYPES.quit) {
      console.log(`Goodbye!`);
      process.exit(0);
    } else {
      console.log('Unknown command');
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
