import amqp from "amqplib";

export async function consume(onMessage) {
    const conn = await amqp.connect('amqp://localhost');
    const channel = await conn.createChannel();
    const queue = 'tasks';

    await channel.assertQueue(queue, { durable: false });
    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
    
    channel.consume(queue, (msg) => {
        onMessage(msg.content.toString());
    }, {
        noAck: true
    });
}

// Use import.meta to determine if the script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    consume(message => console.log("Received:", message));
}