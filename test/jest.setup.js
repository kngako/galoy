const { redis } = require("src/redis")
const { setupMongoConnection } = require("src/mongodb")

let mongoose

beforeAll(async () => {
  if (!global.stopMongoose) {
    mongoose = await setupMongoConnection()
  }
})

afterAll(async () => {
  // avoid to use --forceExit
  redis.disconnect()
  if (mongoose) {
    await mongoose.connection.close()
  }
})

jest.setTimeout(30000)
