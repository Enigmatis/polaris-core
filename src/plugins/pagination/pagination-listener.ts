import {PolarisGraphQLContext} from '@enigmatis/polaris-common';
import {PolarisGraphQLLogger} from '@enigmatis/polaris-graphql-logger';
import {GraphQLRequestContext, GraphQLRequestListener} from 'apollo-server-plugin-base';
import {ApolloServer} from "apollo-server-express";
import {
    getPolarisConnectionManager,
    PolarisEntityManager,
    Transaction,
    TransactionManager
} from '@enigmatis/polaris-typeorm';

export class PaginationListener implements GraphQLRequestListener<PolarisGraphQLContext> {
    private logger: PolarisGraphQLLogger;
    private apolloServer: ApolloServer;

    constructor(logger: PolarisGraphQLLogger, apollo: ApolloServer) {
        this.logger = logger;
        this.apolloServer = apollo;
    }

    public parsingDidStart(
        requestContext: GraphQLRequestContext<PolarisGraphQLContext> &
            Required<Pick<GraphQLRequestContext<PolarisGraphQLContext>, 'metrics' | 'source'>>,
    ): ((err?: Error) => void) | void {
        const request = requestContext;
    }

    public validationDidStart(
        requestContext: GraphQLRequestContext<PolarisGraphQLContext> &
            Required<Pick<GraphQLRequestContext<PolarisGraphQLContext>,
                'metrics' | 'source' | 'document'>>,
    ): ((err?: ReadonlyArray<Error>) => void) | void {
        const request = requestContext;
    }

    public executionDidStart(
        requestContext: GraphQLRequestContext<PolarisGraphQLContext> &
            Required<Pick<GraphQLRequestContext<PolarisGraphQLContext>,
                'metrics' | 'source' | 'document' | 'operationName' | 'operation'>>,
    ): ((err?: Error) => void) | void {
        const request = requestContext;
        // if( no pagination header)
        // if(request.context?.returnedExtensions?.globalDataVersion === 69) return;
        // requestContext.context.returnedExtensions = {globalDataVersion: 69};
        //
        // for excutes{
        //     const result = this.apolloServer.executeOperation(requestContext.request + headers).then (current page logic);
        // }
    }

}
