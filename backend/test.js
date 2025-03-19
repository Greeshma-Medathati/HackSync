import { createClient } from "redis";

const client = createClient({
  url: "redis://default:DsmKAxlwlpFsi5G9BhJ4unLcmbkPkkTM@redis-12738.c240.us-east-1-3.ec2.redns.redis-cloud.com:12738",
});

client.connect()
  .then(() => {
    console.log("✅ Connected to Redis successfully!");
    return client.set("testKey", "Hello Redis!");
  })
  .then(() => client.get("testKey"))
  .then(value => console.log("Stored value in Redis:", value))
  .catch(err => console.error("❌ Redis connection error:", err))
  .finally(() => client.quit());
