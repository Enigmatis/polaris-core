import {PolarisGraphQLContext} from '@enigmatis/polaris-common';
import {PolarisGraphQLLogger} from '@enigmatis/polaris-graphql-logger';
import {ApolloServerPlugin, GraphQLRequestContext, GraphQLRequestListener,} from 'apollo-server-plugin-base';
import {PaginationListener} from './pagination-listener';
import {ApolloServer} from "apollo-server-express";

export class PaginationPlugin implements ApolloServerPlugin<PolarisGraphQLContext> {
    private logger: PolarisGraphQLLogger;
    private apolloServer: ApolloServer;

    constructor(logger: PolarisGraphQLLogger, apollo: ApolloServer) {
        this.logger = logger;
        this.apolloServer = apollo;
    }

    public requestDidStart(
        requestContext: GraphQLRequestContext<PolarisGraphQLContext>,
    ): GraphQLRequestListener<PolarisGraphQLContext> | void {
        return new PaginationListener(this.logger, this.apolloServer);
    }
}
