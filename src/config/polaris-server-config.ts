import { ApplicationLogProperties, LoggerConfiguration } from '@enigmatis/polaris-logs';
import { MiddlewareConfiguration } from '../index';

export interface PolarisServerConfig {
    typeDefs: any;
    resolvers: any;
    port: number;
    applicationLogProperties: ApplicationLogProperties;
    customMiddlewares?: any[];
    customContext?: (context: any) => any;
    loggerConfiguration?: LoggerConfiguration;
    middlewareConfiguration?: MiddlewareConfiguration;
    endpoint?: string;
}
