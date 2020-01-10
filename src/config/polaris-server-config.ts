import { ApplicationProperties, LoggerConfiguration } from '@enigmatis/polaris-logs';
import { Connection } from '@enigmatis/polaris-typeorm';
import { ApolloServerExpressConfig } from 'apollo-server-express';
import { MiddlewareConfiguration } from '../index';

export interface PolarisServerConfig extends ApolloServerExpressConfig {
    port: number;
    applicationProperties: ApplicationProperties;
    loggerConfiguration: LoggerConfiguration;
    middlewareConfiguration?: MiddlewareConfiguration;
    customMiddlewares?: any[];
    visionServer?: string;
    customContext?: (context: any) => any;
    connection?: Connection;
}
