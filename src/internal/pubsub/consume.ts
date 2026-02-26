import {
  type Channel,
  type ChannelModel, type Replies
} from "amqplib";

export enum AckType {
  Ack,
  NackDiscard,
  NackRequeue,
}

export enum SimpleQueueType {
  Durable,
  Transient,
}

export async function declareAndBind(
  conn: ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
): Promise<[Channel, Replies.AssertQueue]> {
  const channel = await conn.createChannel()
  const queue = await channel.assertQueue(queueName, {
    durable: queueType === SimpleQueueType.Durable,
    autoDelete: queueType === SimpleQueueType.Transient,
    exclusive: queueType === SimpleQueueType.Transient,
    arguments: {
      "x-dead-letter-exchange": "peril_dlx",
    },
  })

  await channel.bindQueue(queueName, exchange, key)

  return [channel, queue];
}

export async function subscribeJSON<T>(
  conn: ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType, // an enum to represent "durable" or "transient"
  handler: (data: T) => Promise<AckType> | AckType,
): Promise<void> {
  const [ch, queue] = await declareAndBind(
    conn,
    exchange,
    queueName,
    key,
    queueType,
  );

  await ch.consume(queue.queue, async function (msg) {
    if (!msg) return;

    let data: T;
    try {
      data = JSON.parse(msg.content.toString());
    } catch (err) {
      console.error("Could not unmarshal message:", err);
      return;
    }

    try {
      const result = await handler(data);
      switch (result) {
        case AckType.Ack:
          ch.ack(msg);
          break;
        case AckType.NackDiscard:
          ch.nack(msg, false, false);
          break;
        case AckType.NackRequeue:
          ch.nack(msg, false, true);
          break;
        default:
          const unreachable: never = result;
          console.error("Unexpected ack type:", unreachable);
          return;
      }
    } catch (err) {
      console.error("Error handling message:", err);
      ch.nack(msg, false, false);
      return;
    }
  });

}