import { ApplicationProperties, LoggerConfiguration } from '@enigmatis/polaris-logs';
import { Connection } from '@enigmatis/polaris-typeorm';
import { MiddlewareConfiguration } from '../index';

export interface PolarisServerConfig {
    typeDefs: any;
    resolvers: any;
    port: number;
    applicationProperties?: ApplicationProperties;
    customMiddlewares?: any[];
    customContext?: (context: any, connection?: Connection) => any;
    loggerConfiguration?: LoggerConfiguration;
    middlewareConfiguration?: MiddlewareConfiguration;
    connection?: Connection;
}
