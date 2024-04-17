import amqp from 'amqplib';
// Publisher RPC Function
export async function publishRPC(num) {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const assertQueueResult = await channel.assertQueue('', { exclusive: true });
    const replyQueue = assertQueueResult.queue;
    const correlationId = generateUuid();
    console.log(`[x] Requesting processing for number ${num}`);
    return new Promise((resolve, reject) => {
        channel.consume(replyQueue, (msg) => {
            if (msg && msg.properties.correlationId === correlationId) {
                console.log('[.] Got response:', msg.content.toString());
                resolve(msg.content.toString());
                connection.close().catch(error => console.error('Failed to close connection', error));
            }
        }, { noAck: true });
        channel.sendToQueue('rpc_queue', Buffer.from(num.toString()), {
            correlationId: correlationId,
            replyTo: replyQueue
        });
    });
}
function generateUuid() {
    return Math.random().toString() +
        Math.random().toString() +
        Math.random().toString();
}
// Consumer Function
export async function startConsumer() {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const queue = 'rpc_queue';
    await channel.assertQueue(queue, { durable: false });
    console.log('[x] Awaiting RPC requests');
    channel.consume(queue, (msg) => {
        if (msg) {
            const num = parseInt(msg.content.toString(), 10);
            const result = num * 2; // Example processing: double the number
            console.log(`[.] Processing number: ${num} to ${result}`);
            channel.sendToQueue(msg.properties.replyTo, Buffer.from(result.toString()), { correlationId: msg.properties.correlationId });
            channel.ack(msg);
        }
    });
    return { channel, connection };
}
// Set up a way to stop the consumer
export function stopConsumer(consumerInfo) {
    consumerInfo.channel.close().catch(error => console.error('Failed to close channel', error));
    consumerInfo.connection.close().catch(error => console.error('Failed to close connection', error));
}
