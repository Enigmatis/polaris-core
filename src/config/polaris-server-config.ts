import { ApplicationLogProperties, LoggerConfiguration } from '@enigmatis/polaris-logs';
import { MiddlewareConfiguration } from './middleware-configuration';

export interface PolarisServerConfig {
    typeDefs: any;
    resolvers: any;
    port: number;
    applicationLogProperties: ApplicationLogProperties;
    loggerConfiguration?: LoggerConfiguration;
    middlewareConfiguration?: MiddlewareConfiguration;
    endpoint?: string;
}
