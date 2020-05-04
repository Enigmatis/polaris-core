import { PolarisGraphQLContext, RealitiesHolder } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { ApolloServer } from 'apollo-server-express';
import {
    ApolloServerPlugin,
    GraphQLRequestContext,
    GraphQLRequestListener,
} from 'apollo-server-plugin-base';
import { GraphQLSchema } from 'graphql';
import { PolarisServer, SnapshotConfiguration } from '../..';
import { SnapshotListener } from './snapshot-listener';

export class SnapshotPlugin implements ApolloServerPlugin<PolarisGraphQLContext> {
    private readonly logger: PolarisGraphQLLogger;
    private readonly realitiesHolder: RealitiesHolder;
    private readonly snapshotConfiguration: SnapshotConfiguration;
    private readonly server: ApolloServer;

    constructor(
        logger: PolarisGraphQLLogger,
        realitiesHolder: RealitiesHolder,
        snapshotConfiguration: SnapshotConfiguration,
        server: ApolloServer,
    ) {
        this.logger = logger;
        this.realitiesHolder = realitiesHolder;
        this.snapshotConfiguration = snapshotConfiguration;
        this.server = server;
    }

    public requestDidStart(
        requestContext: GraphQLRequestContext<PolarisGraphQLContext>,
    ): GraphQLRequestListener<PolarisGraphQLContext> | void {
        return new SnapshotListener(
            this.logger,
            this.realitiesHolder,
            this.snapshotConfiguration,
            this.server,
        );
    }
}
