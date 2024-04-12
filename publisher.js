const amqp = require('amqplib');

async function publish() {
    const conn = await amqp.connect('amqp://localhost');
    const channel = await conn.createChannel();
    const queue = 'tasks';

    await channel.assertQueue(queue, { durable: false });
    const message = 'Hello RabbitMQ Barlas!';

    channel.sendToQueue(queue, Buffer.from(message));
    console.log(" [x] Sent '%s'", message);

    setTimeout(() => {
        conn.close();
        process.exit(0);
    }, 500);
}

publish().catch(console.warn);
