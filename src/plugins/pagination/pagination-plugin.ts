import { PolarisGraphQLContext } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { ApolloServer } from 'apollo-server-express';
import {
    ApolloServerPlugin,
    GraphQLRequestContext,
    GraphQLRequestListener,
} from 'apollo-server-plugin-base';
import { PolarisServer } from '../..';
import { PaginationListener } from './pagination-listener';

export class PaginationPlugin implements ApolloServerPlugin<PolarisGraphQLContext> {
    private logger: PolarisGraphQLLogger;
    private apolloServer: PolarisServer;

    constructor(logger: PolarisGraphQLLogger, apollo: PolarisServer) {
        this.logger = logger;
        this.apolloServer = apollo;
    }

    public requestDidStart(
        requestContext: GraphQLRequestContext<PolarisGraphQLContext>,
    ): GraphQLRequestListener<PolarisGraphQLContext> | void {
        return new PaginationListener(this.logger, this.apolloServer);
    }
}
