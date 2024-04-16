import express from 'express';
import mongoose from 'mongoose';
import User from './models/User.js';
import { publish } from './publisher.js';
import { publishRPC } from './message.js';

const server = express();
server.use(express.json());

const PORT = process.env.PORT || 3000;

// Connect to MongoDB only if not in test environment
if (process.env.TEST_ENVIRONMENT !== 'true') {
    mongoose.connect('mongodb://localhost:27017/mydatabase')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
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

server.post('/trigger-rpc', async (req, res) => {
    try {
        const num = parseInt(req.body.num, 10);
        console.log("Received number:", num);
        if (isNaN(num)) {
            return res.status(400).send({ error: 'Provided number is invalid' });
        }
        await publishRPC(num);
        res.status(200).send('RPC request sent successfully.');
    } catch (error) {
        console.error('Error in RPC request:', error);
        res.status(500).send('Failed to process RPC request');
    }
});

export default server;
