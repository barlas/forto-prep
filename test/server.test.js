import chai from 'chai';
const expect = chai.expect;
import request from 'supertest';
import sinon from 'sinon';
import mongoose from 'mongoose';
import User from '../models/User.js';
import app from '../app.js';
import { mockgoose } from 'mockgoose';

describe('API tests', function() {
    before(async function() {
        // Assuming mockgoose prepares mongoose instance
        await mockgoose(mongoose);
        await mongoose.connect('mongodb://example.com/TestingDB', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    });

    afterEach(function() {
        sinon.restore(); // Reset all stubs
    });

    after(async function() {
        await mongoose.disconnect();
    });

    it('should return Hello World', function(done) {
        request(app)
            .get('/')
            .expect(200)
            .end((err, res) => {
                expect(res.text).to.equal('Hello World!');
                done(err);
            });
    });

    it('should create a new user', function(done) {
        const userData = { name: 'John Doe', age: 30 };

        request(app)
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
        request(app)
            .get('/users')
            .expect(200)
            .end((err, res) => {
                expect(res.body).to.be.an('array');
                done(err);
            });
    });
});
