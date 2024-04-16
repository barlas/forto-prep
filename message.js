import amqp from 'amqplib';

// Publisher RPC Function
export async function publishRPC(num) {
    const conn = await amqp.connect('amqp://localhost');
    const channel = await conn.createChannel();
    const requestQueue = 'rpc_queue';
    const replyQueue = await channel.assertQueue('', { exclusive: true });

    const correlationId = generateUuid();

    console.log(`[x] Requesting processing for number ${num}`);

    return new Promise((resolve, reject) => {
        channel.consume(replyQueue.queue, (msg) => {
            if (msg.properties.correlationId === correlationId) {
                console.log('[.] Got response:', msg.content.toString());
                resolve(msg.content.toString());
                conn.close();
            }
        }, { noAck: true });

        channel.sendToQueue(requestQueue,
            Buffer.from(num.toString()),
            { correlationId: correlationId, replyTo: replyQueue.queue });
    });
}

function generateUuid() {
    return Math.random().toString() +
           Math.random().toString() +
           Math.random().toString();
}

let shouldContinue = true;  // Flag to control the lifecycle of the consumer

// Consumer Function
export async function startConsumer() {
    const conn = await amqp.connect('amqp://localhost');
    const channel = await conn.createChannel();
    const queue = 'rpc_queue';

    await channel.assertQueue(queue, { durable: false });
    console.log('[x] Awaiting RPC requests');
    channel.consume(queue, (msg) => {
        const num = parseInt(msg.content.toString(), 10);
        const result = num * 2;  // Dummy processing, e.g., double the number

        console.log(`[.] Processing number: ${num} to ${result}`);
        
        // Send response back
        channel.sendToQueue(msg.properties.replyTo,
            Buffer.from(result.toString()), 
            { correlationId: msg.properties.correlationId });

        channel.ack(msg);
    });
}


// Set up a way to stop the consumer
export function stopConsumer(consumerInfo) {
    shouldContinue = false;  // Signal to stop
    consumerInfo.channel.close();
    consumerInfo.conn.close();
}
