import amqp from 'amqplib';

export async function publish() {
    const conn = await amqp.connect('amqp://localhost');
    const channel = await conn.createChannel();
    const queue = 'tasks';

    await channel.assertQueue(queue, { durable: false });
    const message = 'Hello RabbitMQ! Barlas!!!';
    channel.sendToQueue(queue, Buffer.from(message));
    console.log(" [x] Sent '%s'", message);

    setTimeout(() => {
        conn.close();
    }, 500);
}

// Use import.meta to determine if the script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    publish().catch(error => console.error("Error in publisher:", error));
}