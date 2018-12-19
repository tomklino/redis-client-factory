const debug = require('nice_debug')("REDIS_CLIENT_FACTORY_DEBUG")
const Redis = require('ioredis')

module.exports = function redisClientFactoryInit(conf) {
  async function createSubscriber(opts) {
    const client = await createClient(opts);
    const subscriptions = {}

    client.on('message', (channel, message) => {
      if(!subscriptions[channel]) {
        debug(3, `got message on unrecognized channel. channel:${channel}, message:${message}`)
        return;
      }

      const { callbacks } = subscriptions[channel];
      callbacks.forEach((callback) => {
        callback(message)
      })
    })

    async function subscribeTo(channel, callback) {
      if(subscriptions[channel]) {
        debug(5, "adding callback to already subscribed channel")
        subscriptions[channel].callbacks.push(callback)
        return;
      }

      debug(5, "subscribing to channel", channel)
      await client.subscribe(channel);
      subscriptions[channel] = {
        channel,
        callbacks: [ callback ]
      }
    }

    return { subscribeTo }
  }

  async function createClient(opts) {
    let { waitForReady = false } = opts || {}
    let redis = new Redis(conf)
    return redis.cluster('info')
      .then(() => {
        debug(4, "cluster mode detected")
        return waitForReady ?
          waitForReadyPromise(new Redis.Cluster([conf])) :
          new Redis.Cluster([conf])
      })
      .catch((e) => {
        //single instance mode
        //NOTE: readiness flag skipped, as client is after 'info' command
        //      so it has already emitted the 'ready' event
        return redis
      })
  }

  return {
    createClient,
    createSubscriber
  }
}

function waitForReadyPromise(redisClient) {
  return new Promise((resolve, reject) => {
    redisClient.on('ready', () => {
      resolve(redisClient)
    })
    redisClient.on('error', (e) => {
      reject(e)
    })
  })
}
