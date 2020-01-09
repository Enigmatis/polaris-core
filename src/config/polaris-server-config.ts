import { ApplicationProperties, LoggerConfiguration } from '@enigmatis/polaris-logs';
import { Connection } from '@enigmatis/polaris-typeorm';
import { DocumentNode } from 'graphql';
import { IResolvers } from 'graphql-tools';
import { MiddlewareConfiguration } from '../index';

export interface PolarisServerConfig {
    typeDefs: DocumentNode | DocumentNode[] | string | string[];
    resolvers: IResolvers | IResolvers[];
    port: number;
    applicationProperties: ApplicationProperties;
    loggerConfiguration: LoggerConfiguration;
    middlewareConfiguration: MiddlewareConfiguration;
    customMiddlewares?: any[];
    customContext?: (context: any) => any;
    connection?: Connection;
}
