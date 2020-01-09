import { ApplicationProperties, LoggerConfiguration } from '@enigmatis/polaris-logs';
import { Connection } from '@enigmatis/polaris-typeorm';
import { DocumentNode } from 'graphql';
import { IResolvers } from 'graphql-tools';
import { MiddlewareConfiguration } from '../index';

export interface PolarisServerOptions {
    typeDefs: DocumentNode | DocumentNode[] | string | string[];
    resolvers: IResolvers | IResolvers[];
    port: number;
    applicationProperties?: ApplicationProperties;
    customMiddlewares?: any[];
    customContext?: (context: any) => any;
    loggerConfiguration?: LoggerConfiguration;
    middlewareConfiguration?: MiddlewareConfiguration;
    connection?: Connection;
}
