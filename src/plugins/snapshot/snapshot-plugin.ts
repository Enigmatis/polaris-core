import { PolarisGraphQLContext } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
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
    private readonly snapshotConfiguration: SnapshotConfiguration;
    private readonly polarisServer: PolarisServer;
    private readonly graphQLSchema: GraphQLSchema;

    constructor(
        logger: PolarisGraphQLLogger,
        snapshotConfiguration: SnapshotConfiguration,
        polarisServer: PolarisServer,
        graphQLSchema: GraphQLSchema,
    ) {
        this.logger = logger;
        this.snapshotConfiguration = snapshotConfiguration;
        this.polarisServer = polarisServer;
        this.graphQLSchema = graphQLSchema;
    }

    public requestDidStart(
        requestContext: GraphQLRequestContext<PolarisGraphQLContext>,
    ): GraphQLRequestListener<PolarisGraphQLContext> | void {
        return new SnapshotListener(
            this.logger,
            this.snapshotConfiguration,
            this.polarisServer,
            this.graphQLSchema,
        );
    }
}
