import amqp, { Channel, Connection, ConsumeMessage, Replies } from 'amqplib';

interface ConsumerInfo {
    channel: Channel;
    connection: Connection;
}

// Publisher Function
export async function publish(num: number): Promise<string> {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const assertQueueResult: Replies.AssertQueue = await channel.assertQueue('', { exclusive: true });
    const replyQueue = assertQueueResult.queue;

    const correlationId = generateUuid();
    console.log(`[.] Puslisher: Requesting processing for number ${num}`);

    return new Promise((resolve, reject) => {
        channel.consume(replyQueue, (msg: ConsumeMessage | null) => {
            if (msg && msg.properties.correlationId === correlationId) {
                console.log('[.] Publisher: Got response:', msg.content.toString());
                resolve(msg.content.toString());
                connection.close().catch(error => console.error('Failed to close connection', error));
            }
        }, { noAck: true });

        channel.sendToQueue(
            'rpc_queue',
            Buffer.from(num.toString()),
            {
                correlationId: correlationId,
                replyTo: replyQueue
            }
        );
    });
}

function generateUuid(): string {
    return Math.random().toString() +
           Math.random().toString() +
           Math.random().toString();
}

// Consumer Function
export async function startConsumer(): Promise<ConsumerInfo> {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const queue = 'rpc_queue';

    await channel.assertQueue(queue, { durable: false });
    console.log('[x] Consumer: Awaiting requests');
    channel.consume(queue, (msg: ConsumeMessage | null) => {
        if (msg) {
            const num = parseInt(msg.content.toString(), 10);
            const result = num * 2;

            console.log(`[x] Consumer: Doubling number from ${num} to ${result}`);

            channel.sendToQueue(
                msg.properties.replyTo,
                Buffer.from(result.toString()), 
                { correlationId: msg.properties.correlationId }
            );

            channel.ack(msg);
        }
    });

    return { channel, connection };
}

// Set up a way to stop the consumer
export function stopConsumer(consumerInfo: ConsumerInfo): void {
    consumerInfo.channel.close().catch(error => console.error('Failed to close channel', error));
    consumerInfo.connection.close().catch(error => console.error('Failed to close connection', error));
}
