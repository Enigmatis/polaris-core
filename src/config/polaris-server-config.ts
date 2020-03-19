import { RealitiesHolder } from '@enigmatis/polaris-common';
import { AbstractPolarisLogger, ApplicationProperties, LoggerConfiguration } from '@enigmatis/polaris-logs';
import { PolarisConnection } from '@enigmatis/polaris-typeorm';
import { ApolloServerExpressConfig } from 'apollo-server-express';
import { DocumentNode } from 'graphql';
import { IResolvers } from 'graphql-tools';
import { ExpressContext } from '..';
import { MiddlewareConfiguration } from '../index';

export interface PolarisServerConfig extends ApolloServerExpressConfig {
    typeDefs: DocumentNode | DocumentNode[] | string | string[];
    resolvers: IResolvers | IResolvers[];
    port: number;
    applicationProperties: ApplicationProperties;
    logger: LoggerConfiguration | AbstractPolarisLogger;
    middlewareConfiguration: MiddlewareConfiguration;
    allowSubscription: boolean;
    customMiddlewares?: any[];
    customContext?: (context: ExpressContext) => any;
    connection?: PolarisConnection;
    supportedRealities?: RealitiesHolder;
    shouldAddWarningsToExtensions: boolean;
}
