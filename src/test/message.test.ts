import amqp, { Channel, Connection, ConsumeMessage } from 'amqplib';
import { expect } from 'chai';
import sinon, { SinonSandbox, SinonStub } from 'sinon';
import { publish, startConsumer, stopConsumer } from '../message.js';

describe('RabbitMQ Messaging Tests', () => {
    let sandbox: SinonSandbox;
    let connectStub: SinonStub;
    let channelStub: {
        assertQueue: SinonStub;
        consume: SinonStub;
        sendToQueue: SinonStub;
        close: SinonStub;
        prefetch: SinonStub;
        ack: SinonStub;
    };
    let connectionStub: {
        createChannel: () => Promise<Channel>;
        close: SinonStub<any[], any>;
    } & Connection;
    let consumerInfo: any; // Define the type based on what startConsumer returns
    
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        channelStub = {
            assertQueue: sandbox.stub().resolves({ queue: 'rpc_reply_queue' }),
            consume: sandbox.stub(),
            sendToQueue: sandbox.stub(),
            close: sandbox.stub(),
            prefetch: sandbox.stub().resolves(),
            ack: sandbox.stub()
        };        
    
        connectionStub = {
            createChannel: async () => channelStub,
            close: sandbox.stub().resolves(undefined)
        } as unknown as {
            createChannel: () => Promise<Channel>;
            close: SinonStub<any[], any>;
        } & Connection;
    
        connectStub = sandbox.stub(amqp, 'connect').resolves(connectionStub);
    });

    afterEach(async () => {
        if (consumerInfo) {
            await stopConsumer(consumerInfo);
        }
        sandbox.restore();
    });

    describe('Publishing RPC', () => {
        it('should initiate RPC request correctly', async () => {
            channelStub.sendToQueue.callsFake((queue, content, options) => {
                setImmediate(() => channelStub.consume.firstCall.args[1]({
                    content: Buffer.from('Processed: 20'),
                    properties: { correlationId: options.correlationId }
                } as ConsumeMessage));
            });
        
            await publish(10);
            sinon.assert.calledOnce(connectStub);
            sinon.assert.calledWith(channelStub.assertQueue, '', { exclusive: true });
            sinon.assert.calledOnce(channelStub.sendToQueue);
            expect(channelStub.sendToQueue.calledWith(sinon.match.string, sinon.match.any, sinon.match.has('replyTo', 'rpc_reply_queue'))).to.be.true;
        });
    });

    describe('Consuming Messages', () => {
        beforeEach(() => {
            channelStub.consume.callsFake((queue, onMessage) => {
                const msg: ConsumeMessage = {
                    content: Buffer.from('10'),
                    properties: {
                        contentType: '',
                        contentEncoding: '',
                        headers: {},
                        deliveryMode: 1,
                        correlationId: '12345',
                        replyTo: 'reply_queue',
                        priority: 0, // Example value, adjust as needed
                        expiration: '', // Example value, adjust as needed
                        messageId: '', // Example value, adjust as needed
                        timestamp: 0, // Example value, adjust as needed
                        type: '', // Example value, adjust as needed
                        userId: '', // Example value, adjust as needed
                        appId: '', // Example value, adjust as needed
                        clusterId: '' // Example value, adjust as needed
                        // Add other necessary properties here
                    },
                    fields: {
                        // Add fields related to message delivery
                        consumerTag: '', // Example value, adjust as needed
                        deliveryTag: 0, // Example value, adjust as needed
                        redelivered: false, // Example value, adjust as needed
                        exchange: '', // Example value, adjust as needed
                        routingKey: '' // Example value, adjust as needed
                        // Add other necessary fields here
                    }
                };
                onMessage(msg);
                return Promise.resolve();
            });
            
        });

        it('should consume and respond to a message correctly', async () => {
            await startConsumer();

            sinon.assert.calledOnce(channelStub.consume);
            sinon.assert.calledOnce(channelStub.ack);

            const sendToQueueArgs = channelStub.sendToQueue.firstCall.args;
            expect(sendToQueueArgs[0]).to.equal('reply_queue');
            expect(sendToQueueArgs[1].toString()).to.equal('20');
            expect(sendToQueueArgs[2].correlationId).to.equal('12345');
        });
    });
});
