const chai = require('chai');
const expect = chai.expect;

const redisClientFactoryInit = require('../app')

describe('redisClientFactoryInit tests', function() {
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
})
