import { PolarisGraphQLContext } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { makeExecutablePolarisSchema } from '@enigmatis/polaris-schema';
import { runHttpQuery } from 'apollo-server-core';
import { GraphQLOptions } from 'apollo-server-express';
import {
    ApolloServerPlugin,
    GraphQLRequestContext,
    GraphQLRequestListener,
    GraphQLResponse,
} from 'apollo-server-plugin-base';
import { GraphQLSchema } from 'graphql';
import { cloneDeep, remove } from 'lodash';
import { PolarisServer } from '../..';
import { PaginationPlugin } from './pagination-plugin';

export class PaginationListener implements GraphQLRequestListener<PolarisGraphQLContext> {
    private logger: PolarisGraphQLLogger;
    private polarisServer: PolarisServer;
    private optionsToSend: Partial<GraphQLOptions>;
    private graphQLSchema: GraphQLSchema;

    constructor(logger: PolarisGraphQLLogger, apollo: PolarisServer) {
        this.logger = logger;
        this.polarisServer = apollo;
        this.optionsToSend = cloneDeep(this.polarisServer.apolloServer.requestOptions);
        remove(
            this.optionsToSend.plugins!,
            (x: ApolloServerPlugin) => x instanceof PaginationPlugin,
        );
        this.graphQLSchema = makeExecutablePolarisSchema(
            this.polarisServer.polarisServerConfig.typeDefs,
            this.polarisServer.polarisServerConfig.resolvers,
        );
    }

    public responseForOperation(
        requestContext: GraphQLRequestContext<PolarisGraphQLContext> &
            Required<
                Pick<
                    GraphQLRequestContext<PolarisGraphQLContext>,
                    'metrics' | 'source' | 'document' | 'operationName' | 'operation'
                    >
                >,
    ): Promise<GraphQLResponse | null> | GraphQLResponse | null {
        const request = requestContext.request;
        return new Promise(async () => {
            const result = await runHttpQuery([], {
                method: request.http?.method!,
                query: { ...request },
                options: {
                    ...this.optionsToSend,
                    schema: this.graphQLSchema,
                    context: requestContext,
                },
                request: requestContext.request.http!,
            });
            return result.graphqlResponse;
        });
    }

    validationDidStart(requestContext: GraphQLRequestContext<PolarisGraphQLContext> & Required<Pick<GraphQLRequestContext<PolarisGraphQLContext>, "metrics" | "source" | "document">>): ((err?: ReadonlyArray<Error>) => void) | void {
        return undefined;
    }

    parsingDidStart(requestContext: GraphQLRequestContext<PolarisGraphQLContext> & Required<Pick<GraphQLRequestContext<PolarisGraphQLContext>, "metrics" | "source">>): ((err?: Error) => void) | void {
        return undefined;
    }

    didResolveOperation(requestContext: GraphQLRequestContext<PolarisGraphQLContext> & Required<Pick<GraphQLRequestContext<PolarisGraphQLContext>, "metrics" | "source" | "document" | "operationName" | "operation">>): Promise<void> | void {
        return undefined;
    }

    didEncounterErrors(requestContext: GraphQLRequestContext<PolarisGraphQLContext> & Required<Pick<GraphQLRequestContext<PolarisGraphQLContext>, "metrics" | "source" | "errors">>): Promise<void> | void {
        return undefined;
    }

    executionDidStart(requestContext: GraphQLRequestContext<PolarisGraphQLContext> & Required<Pick<GraphQLRequestContext<PolarisGraphQLContext>, "metrics" | "source" | "document" | "operationName" | "operation">>): ((err?: Error) => void) | void {
        return undefined;
    }

    willSendResponse(requestContext: GraphQLRequestContext<PolarisGraphQLContext> & Required<Pick<GraphQLRequestContext<PolarisGraphQLContext>, "metrics" | "response">>): Promise<void> | void {
        return undefined;
    }
    
    
}
