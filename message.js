import amqp from 'amqplib';

export async function publishRPC(num) {  // Accept `num` as a parameter
    const conn = await amqp.connect('amqp://localhost');
    const channel = await conn.createChannel();
    const requestQueue = 'rpc_queue';
    const replyQueue = await channel.assertQueue('', { exclusive: true });

    const correlationId = generateUuid();

    console.log(`[x] Requesting fib(${num})`);  // Log the number passed to the function

    channel.consume(replyQueue.queue, (msg) => {
        if (msg.properties.correlationId === correlationId) {
            console.log('[.] Got %s', msg.content.toString());
            setTimeout(() => {
                conn.close();  // No need to exit process here
            }, 500);
        }
    }, { noAck: true });

    channel.sendToQueue(requestQueue,
        Buffer.from(num.toString()),
        { correlationId: correlationId, replyTo: replyQueue.queue });
}

function generateUuid() {
    return Math.random().toString() +
           Math.random().toString() +
           Math.random().toString();
}

let shouldContinue = true;  // Flag to control the lifecycle of the consumer

export async function startConsumer() {
    const conn = await amqp.connect('amqp://localhost');
    const channel = await conn.createChannel();
    await channel.assertQueue('rpc_queue', { durable: false });

    channel.prefetch(1);
    console.log(' [x] Awaiting RPC requests');
    const consumerTag = await channel.consume('rpc_queue', (msg) => {
        // Process message...
        if (!shouldContinue) {
            channel.ack(msg);
            channel.cancel(consumerTag);  // Cancel this consumer
        }
    });

    return { channel, conn, consumerTag };  // Return these for potential cleanup
}

// Set up a way to stop the consumer
export function stopConsumer(consumerInfo) {
    shouldContinue = false;  // Signal to stop
    consumerInfo.channel.close();
    consumerInfo.conn.close();
}
