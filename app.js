const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User'); // Ensure the path is correct

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017/mydatabase', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

// POST route to create a new user
app.post('/users', async (req, res) => {
    const newUser = new User(req.body);
    try {
        const savedUser = await newUser.save();
        res.status(201).send(savedUser);
    } catch (error) {
        res.status(400).send(error);
    }
});

// GET route to fetch all users
app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).send(users);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
