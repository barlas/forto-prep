import { expect } from 'chai';
import { describe, it, before, afterEach, beforeEach } from 'mocha'; // Also, import Mocha functions if needed
import sinon from 'sinon';
import amqp from 'amqplib';
import { publish } from '../publisher.js';
import { consume } from '../consumer.js';

describe('RabbitMQ Publisher and Consumer', function() {
    let createChannelStub, connectStub, channelStub;

    beforeEach(() => {
        // Create stubs for channel and connection methods
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

    afterEach(() => {
        sinon.restore();
    });

    it('should publish a message', async function() {
        await publish();
        sinon.assert.calledOnce(connectStub);
        sinon.assert.calledOnce(createChannelStub);
        sinon.assert.calledOnce(channelStub.sendToQueue);
        expect(channelStub.sendToQueue.calledWith('tasks', Buffer.from('Hello RabbitMQ!'))).to.be.true;
    });

    it('should consume a message', async function() {
        const onMessage = sinon.fake();
        channelStub.consume.callsFake((queue, callback) => {
            callback({ content: Buffer.from('Hello RabbitMQ!') });
        });

        await consume(onMessage);
        sinon.assert.calledOnce(connectStub);
        sinon.assert.calledOnce(createChannelStub);
        sinon.assert.calledOnce(channelStub.consume);
        expect(onMessage.calledOnceWithExactly('Hello RabbitMQ!')).to.be.true;
    });
});
