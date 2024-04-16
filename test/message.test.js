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
            prefetch: sandbox.stub().resolves(),
            ack: sandbox.stub()  // Ensure this is stubbed
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
            // Setup to automatically resolve when sendToQueue is called
            channelStub.sendToQueue.callsFake((queue, content, options) => {
                // Simulate a response
                setImmediate(() => channelStub.consume.firstCall.args[1]({
                    content: Buffer.from('Processed: 20'), // example response
                    properties: { correlationId: options.correlationId }
                }));
            });
        
            await publishRPC(10);
            sinon.assert.calledOnce(connectStub);
            sinon.assert.calledWith(channelStub.assertQueue, '', { exclusive: true });
            sinon.assert.calledOnce(channelStub.sendToQueue);
            expect(channelStub.sendToQueue.calledWith(sinon.match.string, sinon.match.any, sinon.match.has('replyTo', 'rpc_reply_queue'))).to.be.true;
        });        
    });

    describe('Consuming Messages', () => {
        beforeEach(() => {
            // Setup to automatically acknowledge when consume is called
            channelStub.consume.callsFake((queue, onMessage) => {
                const msg = {
                    content: Buffer.from('10'),
                    properties: {
                        replyTo: 'reply_queue',
                        correlationId: '12345'
                    }
                };
                onMessage(msg); // Immediately invoke the message handler
                return Promise.resolve(); // Assuming the consumer subscribes successfully
            });
        });
    
        it('should consume and respond to a message correctly', async () => {
            await startConsumer();  // This should setup the consumer to listen and process messages
    
            sinon.assert.calledOnce(channelStub.consume); // Verify that consume was called once
            sinon.assert.calledOnce(channelStub.ack); // Verify that ack was called once
    
            // Check if a message was sent to the reply queue as part of the response
            sinon.assert.calledOnce(channelStub.sendToQueue);
            const sendToQueueArgs = channelStub.sendToQueue.firstCall.args;
            expect(sendToQueueArgs[0]).to.equal('reply_queue'); // the queue name
            expect(sendToQueueArgs[1].toString()).to.equal('20'); // the message content based on doubling '10'
            expect(sendToQueueArgs[2].correlationId).to.equal('12345'); // the correlation ID
        });
    });
    
    
});
