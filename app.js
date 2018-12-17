const Redis = require('ioredis')

module.exports = function redisClientFactoryInit(conf) {
  async function createClient(opts) {
    let { waitForReady = false } = opts || {}
    let redis = new Redis(conf)
    return redis.cluster('info')
      .then(() => {
        console.log("cluster mode detected")
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

  return { createClient }
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
