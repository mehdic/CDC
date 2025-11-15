import { DataSource } from 'typeorm';
type RedisClientType = any;
export declare function initializeHealthCheck(dataSource: DataSource, redis?: RedisClientType): void;
export declare const healthRouter: import("express-serve-static-core").Router;
export default healthRouter;
//# sourceMappingURL=health.d.ts.map