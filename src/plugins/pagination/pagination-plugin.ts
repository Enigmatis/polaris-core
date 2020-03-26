import { PolarisGraphQLContext } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { GraphQLOptions } from 'apollo-server-express';
import {
    ApolloServerPlugin,
    GraphQLRequestContext,
    GraphQLRequestListener,
} from 'apollo-server-plugin-base';
import { PaginationListener } from './pagination-listener';

export class PaginationPlugin implements ApolloServerPlugin<PolarisGraphQLContext> {
    private readonly paginationListener: PaginationListener;

    constructor(logger: PolarisGraphQLLogger, httpQueryOptions: GraphQLOptions) {
        this.paginationListener = new PaginationListener(logger, httpQueryOptions);
    }

    public requestDidStart(
        requestContext: GraphQLRequestContext<PolarisGraphQLContext>,
    ): GraphQLRequestListener<PolarisGraphQLContext> | void {
        return this.paginationListener;
    }
}
