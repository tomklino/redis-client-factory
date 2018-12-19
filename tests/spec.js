const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
const sleep = require('await-sleep');

chai.use(sinonChai)
const expect = chai.expect;

const redisClientFactoryInit = require('../app')

describe('redisClientFactoryInit tests', function() {
  this.timeout('5s')
  this.slow('1s')

  it('connects to redis single instance mode', async () => {
    let redisClientFactory = redisClientFactoryInit({ host: 'localhost' })
    let redis = await redisClientFactory.createClient()
    await redis.set('took123', 1);
    let took = await redis.get('took123')
    expect(took).to.eql('1')
    redis.quit()
  })

  it('connects to redis cluster mode', async () => {
    let redisClientFactory = redisClientFactoryInit({
      host: 'localhost',
      port: 7000
    })
    let redis = await redisClientFactory.createClient()
    await redis.set('took123', 1);
    let took = await redis.get('took123')
    expect(took).to.eql('1')
    let nodes = redis.nodes()
    await Promise.all(nodes.map((node) => {
      node.disconnect()
    }))
    redis.disconnect()
  })

  it('connects to redis single instance mode with waitForReady flag', async () => {
    let redisClientFactory = redisClientFactoryInit({ host: 'localhost' })
    let redis = await redisClientFactory.createClient({ waitForReady: true })
    await redis.set('took123', 1);
    let took = await redis.get('took123')
    expect(took).to.eql('1')
    redis.quit()
  })

  it('connects to redis cluster mode with waitForReady flag', async () => {
    let redisClientFactory = redisClientFactoryInit({
      host: 'localhost',
      port: 7000
    })
    let redis = await redisClientFactory.createClient({ waitForReady: true })
    await redis.set('took123', 1);
    let took = await redis.get('took123')
    expect(took).to.eql('1')
    let nodes = redis.nodes()
    await Promise.all(nodes.map((node) => {
      node.disconnect()
    }))
    redis.disconnect()
  })
})

describe('subscriber object tests', function() {
  this.timeout('5s')
  this.slow('2s')

  it('gets a subscriber object', async() => {
    let redisClientFactory = redisClientFactoryInit({ host: 'localhost' });
    let subscriber = await redisClientFactory.createSubscriber();
    let redisClient = await redisClientFactory.createClient();
    let callback = sinon.spy()

    let test_channel = 'test-channel', test_message = 'test-message';

    await subscriber.subscribeTo(test_channel, callback)

    redisClient.publish(test_channel, test_message)

    //publish is async and redis gives no indication for when a subscriber
    //got the message in clusuter mode
    await sleep(250);

    expect(callback).to.have.been.calledWith(test_message)
  })

  it('gets a subscriber object in cluster mode', async() => {
    let redisClientFactory = redisClientFactoryInit({
      host: 'localhost',
      port: 7000
    })
    let subscriber = await redisClientFactory.createSubscriber();
    let redisClient = await redisClientFactory.createClient();
    let callback = sinon.spy()

    let test_channel = 'test-channel', test_message = 'test-message';

    await subscriber.subscribeTo(test_channel, callback)

    redisClient.publish(test_channel, test_message)

    //publish is async and redis gives no indication for when a subscriber
    //got the message in clusuter mode
    await sleep(250);

    expect(callback).to.have.been.calledWith(test_message)
  })

  it('subscribes and unsubscirbes', async() => {
    let redisClientFactory = redisClientFactoryInit({ host: 'localhost' });
    let subscriber = await redisClientFactory.createSubscriber();
    let redisClient = await redisClientFactory.createClient();
    let callback = sinon.spy()

    let test_channel = 'test-channel', test_message = 'test-message';

    await subscriber.subscribeTo(test_channel, callback)

    await subscriber.unsubscribeFrom(test_channel)

    redisClient.publish(test_channel, test_message)

    //publish is async and redis gives no indication for when a subscriber
    //got the message in clusuter mode
    await sleep(250);

    expect(callback).to.not.have.been.called
  })

  it('subscribes and unsubscirbes in cluster mode', async() => {
    let redisClientFactory = redisClientFactoryInit({
      host: 'localhost',
      port: 7000
    })
    let subscriber = await redisClientFactory.createSubscriber();
    let redisClient = await redisClientFactory.createClient();
    let callback = sinon.spy()

    let test_channel = 'test-channel', test_message = 'test-message';

    await subscriber.subscribeTo(test_channel, callback)

    await subscriber.unsubscribeFrom(test_channel)

    redisClient.publish(test_channel, test_message)

    //publish is async and redis gives no indication for when a subscriber
    //got the message in clusuter mode
    await sleep(250);

    expect(callback).to.not.have.been.called
  })
})
