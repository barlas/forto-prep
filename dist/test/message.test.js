import amqp from 'amqplib';
import { expect } from 'chai';
import sinon from 'sinon';
import { publish, startConsumer, stopConsumer } from '../message.js';
describe('RabbitMQ Messaging Tests', () => {
    let sandbox;
    let connectStub;
    let channelStub;
    let connectionStub;
    let consumerInfo;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        channelStub = {
            assertQueue: sandbox.stub().resolves({ queue: 'reply_queue' }),
            consume: sandbox.stub(),
            sendToQueue: sandbox.stub(),
            close: sandbox.stub(),
            prefetch: sandbox.stub().resolves(),
            ack: sandbox.stub()
        };
        connectionStub = {
            createChannel: async () => channelStub,
            close: sandbox.stub().resolves(undefined)
        };
        connectStub = sandbox.stub(amqp, 'connect').resolves(connectionStub);
    });
    afterEach(async () => {
        if (consumerInfo) {
            await stopConsumer(consumerInfo);
        }
        sandbox.restore();
    });
    describe('Publishing', () => {
        it('should initiate request correctly', async () => {
            channelStub.sendToQueue.callsFake((queue, content, options) => {
                setImmediate(() => channelStub.consume.firstCall.args[1]({
                    content: Buffer.from('Processed: 20'),
                    properties: { correlationId: options.correlationId }
                }));
            });
            await publish(10);
            sinon.assert.calledOnce(connectStub);
            sinon.assert.calledWith(channelStub.assertQueue, '', { exclusive: true });
            sinon.assert.calledOnce(channelStub.sendToQueue);
            expect(channelStub.sendToQueue.calledWith(sinon.match.string, sinon.match.any, sinon.match.has('replyTo', 'reply_queue'))).to.be.true;
        });
    });
    describe('Consuming Messages', () => {
        beforeEach(() => {
            channelStub.consume.callsFake((queue, onMessage) => {
                const msg = {
                    content: Buffer.from('10'),
                    properties: {
                        contentType: '',
                        contentEncoding: '',
                        headers: {},
                        deliveryMode: 1,
                        correlationId: '12345',
                        replyTo: 'reply_queue',
                        priority: 0,
                        expiration: '',
                        messageId: '',
                        timestamp: 0,
                        type: '',
                        userId: '',
                        appId: '',
                        clusterId: ''
                    },
                    fields: {
                        consumerTag: '',
                        deliveryTag: 0,
                        redelivered: false,
                        exchange: '',
                        routingKey: ''
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
