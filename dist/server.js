import express from 'express';
import mongoose from 'mongoose';
import { publish, startConsumer, stopConsumer } from './message.js';
import User from './models/User.js';
const server = express();
server.use(express.json());
const PORT = process.env.PORT || 3000;
let consumerInfo = null;
async function initializeConsumer() {
    try {
        const result = await startConsumer();
        if (result) {
            consumerInfo = result;
        }
        else {
            console.error('No consumer info returned');
        }
    }
    catch (error) {
        console.error('Failed to start consumer:', error);
    }
}
const connectToMongoDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/mydatabase');
        console.log('MongoDB connected');
    }
    catch (err) {
        console.error('MongoDB connection error:', err);
        throw err;
    }
};
const startServer = async () => {
    try {
        await connectToMongoDB();
        server.listen(PORT, async () => {
            console.log(`Server running on port ${PORT}`);
            await initializeConsumer();
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
    }
};
server.get('/', (req, res) => {
    res.send('Hello World!');
});
server.post('/users', async (req, res) => {
    const newUser = new User(req.body);
    try {
        const savedUser = await newUser.save();
        res.status(201).send(savedUser);
    }
    catch (error) {
        res.status(400).send(error);
    }
});
// curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"Barlas", "age":30}'
server.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).send(users);
    }
    catch (error) {
        res.status(500).send(error);
    }
});
// curl -X POST http://localhost:3000/queue -H "Content-Type: application/json" -d '{"num": 5}'
server.post('/queue', async (req, res) => {
    try {
        const num = parseInt(req.body.num, 10);
        if (isNaN(num)) {
            return res.status(400).send({ error: 'Provided number is invalid' });
        }
        const result = await publish(num);
        res.status(200).send(`RPC request processed successfully, result: ${result}`);
    }
    catch (error) {
        console.error('Error in RPC request:', error);
        res.status(500).send('Failed to process RPC request');
    }
});
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    if (consumerInfo) {
        await stopConsumer(consumerInfo);
        console.log('Consumer stopped successfully');
    }
    process.exit(0);
});
if (process.env.TEST_ENVIRONMENT !== 'true') {
    startServer();
}
export default server;
