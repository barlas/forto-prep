import { expect } from 'chai';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import sinon from 'sinon';
import request from 'supertest';
import server from '../server.js';

let mongoServer;

before(async function() {
    // Start the in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

after(async function() {
    await mongoose.disconnect();
    await mongoServer.stop();
});


describe('API tests', function() {
    afterEach(function() {
        sinon.restore(); // Reset all stubs
    });

    it('should return Hello World', function(done) {
        request(server)
            .get('/')
            .expect(200)
            .end((err, res) => {
                expect(res.text).to.equal('Hello World!');
                done(err);
            });
    });

    it('should create a new user', function(done) {
        const userData = { name: 'John Doe', age: 30 };

        request(server)
            .post('/users')
            .send(userData)
            .expect(201)
            .end((err, res) => {
                expect(res.body).to.have.property('_id');
                expect(res.body.name).to.equal('John Doe');
                done(err);
            });
    });

    it('should fetch all users', function(done) {
        request(server)
            .get('/users')
            .expect(200)
            .end((err, res) => {
                expect(res.body).to.be.an('array');
                done(err);
            });
    });
});
