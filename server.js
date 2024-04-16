import express from 'express';
import mongoose from 'mongoose';
import User from './models/User.js';
import { publishRPC, startConsumer, stopConsumer } from './message.js';

const server = express();
server.use(express.json());

const PORT = process.env.PORT || 3000;
let consumerInfo = null;  // This will hold your consumer connection details

// Initialize and start the consumer
async function initializeConsumer() {
    try {
        consumerInfo = await startConsumer();
        console.log('Consumer started successfully');
    } catch (error) {
        console.error('Failed to start consumer:', error);
    }
}

// Connect to MongoDB only if not in test environment
if (process.env.TEST_ENVIRONMENT !== 'true') {
    mongoose.connect('mongodb://localhost:27017/mydatabase', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => {
        console.log('MongoDB connected');
        server.listen(PORT, async () => {
            console.log(`Server running on port ${PORT}`);
            await initializeConsumer();
        });
    }).catch(err => {
        console.error('MongoDB connection error:', err);
    });
}

server.get('/', (req, res) => {
    res.send('Hello World!');
});

server.post('/users', async (req, res) => {
    const newUser = new User(req.body);
    try {
        const savedUser = await newUser.save();
        res.status(201).send(savedUser);
    } catch (error) {
        res.status(400).send(error);
    }
});

server.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).send(users);
    } catch (error) {
        res.status(500).send(error);
    }
});

server.post('/trigger-publish', async (req, res) => {
    try {
        await publish();
        res.status(200).send('Message published successfully');
    } catch (error) {
        res.status(500).send('Failed to publish message');
    }
});

// Express Handler for RPC
// curl -X POST http://localhost:3000/trigger-rpc -H "Content-Type: application/json" -d '{"num": 1}'
server.post('/trigger-rpc', async (req, res) => {
    try {
        const num = parseInt(req.body.num, 10);
        if (isNaN(num)) {
            return res.status(400).send({ error: 'Provided number is invalid' });
        }

        const result = await publishRPC(num);
        res.status(200).send(`RPC request processed successfully, result: ${result}`);
    } catch (error) {
        console.error('Error in RPC request:', error);
        res.status(500).send('Failed to process RPC request');
    }
});

// Graceful shutdown and cleanup
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    if (consumerInfo) {
        await stopConsumer(consumerInfo);
        console.log('Consumer stopped successfully');
    }
    process.exit(0);
});

export default server;