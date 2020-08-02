import { RealitiesHolder } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { ApplicationProperties } from '@enigmatis/polaris-logs';
import { PolarisConnectionManager } from '@enigmatis/polaris-typeorm';
import { ApolloServerExpressConfig } from 'apollo-server-express';
import { DocumentNode } from 'graphql';
import { IResolvers } from 'graphql-tools';
import { ExpressContext } from '..';
import { MiddlewareConfiguration } from '../index';
import { SnapshotConfiguration } from './snapshot-configuration';

export interface PolarisServerConfig extends Omit<ApolloServerExpressConfig, 'logger'> {
    typeDefs: DocumentNode | DocumentNode[] | string | string[];
    resolvers: IResolvers | IResolvers[];
    port: number;
    applicationProperties: ApplicationProperties;
    logger: PolarisGraphQLLogger;
    middlewareConfiguration: MiddlewareConfiguration;
    allowSubscription: boolean;
    customMiddlewares?: any[];
    customContext?: (context: ExpressContext) => any;
    supportedRealities: RealitiesHolder;
    shouldAddWarningsToExtensions: boolean;
    allowMandatoryHeaders: boolean;
    snapshotConfig: SnapshotConfiguration;
    connectionManager?: PolarisConnectionManager;
}
