import amqp from 'amqplib';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';
import { consume } from '../consumer.js';
import { publish } from '../publisher.js';

describe('RabbitMQ Publisher and Consumer Tests', function() {
    let createChannelStub, connectStub, channelStub;

    // Setup stubs for all tests in this suite
    beforeEach(() => {
        channelStub = {
            assertQueue: sinon.stub().resolves(),
            sendToQueue: sinon.stub().resolves(),
            consume: sinon.stub().resolves(),
            ack: sinon.stub(),
            close: sinon.stub()
        };
        createChannelStub = sinon.stub().resolves(channelStub);
        connectStub = sinon.stub(amqp, 'connect').resolves({
            createChannel: createChannelStub,
            close: sinon.stub()
        });
    });

    // Reset stubs after each test
    afterEach(() => {
        sinon.restore();
    });

    it('should successfully publish a message to the queue', async function() {
        await publish();
        sinon.assert.calledOnce(connectStub);
        sinon.assert.calledOnce(createChannelStub);
        sinon.assert.calledOnce(channelStub.sendToQueue);

        const [queueName, messageBuffer] = channelStub.sendToQueue.firstCall.args;
        expect(queueName).to.equal('tasks');
        expect(messageBuffer.toString()).to.equal(Buffer.from('Hello RabbitMQ! Barlas!!!').toString());
    });

    it('should correctly handle message consumption', async function() {
        const onMessage = sinon.fake();
        channelStub.consume.callsFake((queue, callback) => {
            callback({ content: Buffer.from('Hello RabbitMQ! Barlas!!!') });
        });

        await consume(onMessage);
        sinon.assert.calledOnce(connectStub);
        sinon.assert.calledOnce(createChannelStub);
        sinon.assert.calledOnce(channelStub.consume);
        expect(onMessage.calledOnceWithExactly('Hello RabbitMQ! Barlas!!!')).to.be.true;
    });
});
