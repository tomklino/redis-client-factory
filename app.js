const Redis = require('ioredis')

module.exports = function redisClientFactoryInit(conf) {
  async function createClient() {
    let redis = new Redis(conf)
    return redis.cluster('info')
      .then(() => {
        console.log("cluster mode detected")
        return new Redis.Cluster([conf])
      })
      .catch((e) => {
        return redis
      })
  }

  return { createClient }
}
