import amqp from 'amqplib';
import { expect } from 'chai';
import sinon from 'sinon';
import { publishRPC, startConsumer, stopConsumer } from '../message.js';

describe('RabbitMQ Messaging Tests', () => {
    let sandbox, connectStub, channelStub, connectionStub;
    beforeEach(() => {
        sandbox = sinon.createSandbox(); // Initialize a new sandbox for each test
        channelStub = {
            assertQueue: sandbox.stub().resolves({ queue: 'rpc_reply_queue' }),
            consume: sandbox.stub(),
            sendToQueue: sandbox.stub(),
            close: sandbox.stub(),
            prefetch: sandbox.stub().resolves()
        };

        connectionStub = {
            createChannel: async () => channelStub,
            close: sandbox.stub()
        };

        connectStub = sandbox.stub(amqp, 'connect').resolves(connectionStub);
    });

    let consumerInfo;
    afterEach(async () => {
        if (consumerInfo) {
            await stopConsumer(consumerInfo); // Make sure this function properly cleans up
        }
        sandbox.restore(); // Restore all stubs and mocks
    });
    
    describe('Publishing RPC', () => {
        it('should initiate RPC request correctly', async () => {
            // Only start consumer here if needed for this test
            await publishRPC(10);
            sinon.assert.calledOnce(connectStub);
            sinon.assert.calledWith(channelStub.assertQueue, '', { exclusive: true });
            sinon.assert.calledOnce(channelStub.sendToQueue);
            expect(channelStub.sendToQueue.calledWith(sinon.match.string, sinon.match.any, sinon.match.has('replyTo', 'rpc_reply_queue'))).to.be.true;
        });
    });

    describe('Consuming Messages', () => {
        beforeEach(async () => {
            consumerInfo = await startConsumer();  // Start the consumer here if necessary
        });

        it('should consume and respond to a message correctly', async () => {
            sinon.assert.calledOnce(connectStub); // This will fail if consumer is started in beforeEach at describe level
            sinon.assert.calledWith(channelStub.assertQueue, 'rpc_queue', { durable: false });
            sinon.assert.calledOnce(channelStub.prefetch);
            sinon.assert.calledOnce(channelStub.consume);
        });
    });
});
