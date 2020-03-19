import { RealitiesHolder } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { ApplicationProperties, LoggerConfiguration } from '@enigmatis/polaris-logs';
import { PolarisConnection } from '@enigmatis/polaris-typeorm';
import { ApolloServerExpressConfig } from 'apollo-server-express';
import { DocumentNode } from 'graphql';
import { IResolvers } from 'graphql-tools';
import { ExpressContext, MiddlewareConfiguration } from '..';

export interface PolarisServerOptions extends ApolloServerExpressConfig {
    typeDefs: DocumentNode | DocumentNode[] | string | string[];
    resolvers: IResolvers | IResolvers[];
    port: number;
    applicationProperties?: ApplicationProperties;
    logger?: LoggerConfiguration | PolarisGraphQLLogger;
    middlewareConfiguration?: MiddlewareConfiguration;
    allowSubscription?: boolean;
    customMiddlewares?: any[];
    customContext?: (context: ExpressContext) => any;
    connection?: PolarisConnection;
    supportedRealities?: RealitiesHolder;
    shouldAddWarningsToExtensions?: boolean;
}
