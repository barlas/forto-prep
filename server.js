import express from 'express';
import mongoose from 'mongoose';
import User from './models/User.js';

const server = express();
server.use(express.json());

const PORT = process.env.PORT || 3000;

// Connect to MongoDB only if not in test environment
if (process.env.TEST_ENVIRONMENT !== 'true') {
    mongoose.connect('mongodb://localhost:27017/mydatabase', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));
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

if (process.env.TEST_ENVIRONMENT !== 'true') {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default server;
