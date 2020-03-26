import { PolarisGraphQLContext } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import {
    ApolloServerPlugin,
    GraphQLRequestContext,
    GraphQLRequestListener,
} from 'apollo-server-plugin-base';
import { GraphQLSchema } from 'graphql';
import { PolarisServer } from '../..';
import { SnapshotListener } from './snapshot-listener';

export class SnapshotPlugin implements ApolloServerPlugin<PolarisGraphQLContext> {
    private readonly logger: PolarisGraphQLLogger;
    private readonly polarisServer: PolarisServer;
    private readonly graphQLSchema: GraphQLSchema;

    constructor(
        logger: PolarisGraphQLLogger,
        polarisServer: PolarisServer,
        graphQLSchema: GraphQLSchema,
    ) {
        this.logger = logger;
        this.polarisServer = polarisServer;
        this.graphQLSchema = graphQLSchema;
    }

    public requestDidStart(
        requestContext: GraphQLRequestContext<PolarisGraphQLContext>,
    ): GraphQLRequestListener<PolarisGraphQLContext> | void {
        return new SnapshotListener(this.logger, this.polarisServer, this.graphQLSchema);
    }
}
