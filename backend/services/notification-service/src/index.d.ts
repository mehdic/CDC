import { Application } from 'express';
import { RedisClientType } from 'redis';
import './workers/pushWorker';
declare const app: Application;
declare let redisClient: RedisClientType;
export { app, redisClient };
//# sourceMappingURL=index.d.ts.map