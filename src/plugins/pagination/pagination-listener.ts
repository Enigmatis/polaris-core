import { PolarisGraphQLContext } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { makeExecutablePolarisSchema } from '@enigmatis/polaris-schema';
import { runHttpQuery } from 'apollo-server-core';
import { GraphQLOptions } from 'apollo-server-express';
import {
    ApolloServerPlugin,
    GraphQLRequesPolarisGraphQLContext,
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
        requesPolarisGraphQLContext: GraphQLRequesPolarisGraphQLContext<PolarisGraphQLContext> &
            Required<
                Pick<
                    GraphQLRequesPolarisGraphQLContext<PolarisGraphQLContext>,
                    'metrics' | 'source' | 'document' | 'operationName' | 'operation'
                    >
                >,
    ): Promise<GraphQLResponse | null> | GraphQLResponse | null {
        const request = requesPolarisGraphQLContext.request;
        return new Promise(async () => {
            const result = await runHttpQuery([], {
                method: request.http?.method!,
                query: { ...request },
                options: {
                    ...this.optionsToSend,
                    schema: this.graphQLSchema,
                    context: requesPolarisGraphQLContext,
                },
                request: requesPolarisGraphQLContext.request.http!,
            });
            return result.graphqlResponse;
        });
    }

    validationDidStart(requesPolarisGraphQLContext: GraphQLRequesPolarisGraphQLContext<PolarisGraphQLContext> & Required<Pick<GraphQLRequesPolarisGraphQLContext<PolarisGraphQLContext>, "metrics" | "source" | "document">>): ((err?: ReadonlyArray<Error>) => void) | void {
        return undefined;
    }

    parsingDidStart(requesPolarisGraphQLContext: GraphQLRequesPolarisGraphQLContext<PolarisGraphQLContext> & Required<Pick<GraphQLRequesPolarisGraphQLContext<PolarisGraphQLContext>, "metrics" | "source">>): ((err?: Error) => void) | void {
        return undefined;
    }

    didResolveOperation(requesPolarisGraphQLContext: GraphQLRequesPolarisGraphQLContext<PolarisGraphQLContext> & Required<Pick<GraphQLRequesPolarisGraphQLContext<PolarisGraphQLContext>, "metrics" | "source" | "document" | "operationName" | "operation">>): Promise<void> | void {
        return undefined;
    }

    didEncounterErrors(requesPolarisGraphQLContext: GraphQLRequesPolarisGraphQLContext<PolarisGraphQLContext> & Required<Pick<GraphQLRequesPolarisGraphQLContext<PolarisGraphQLContext>, "metrics" | "source" | "errors">>): Promise<void> | void {
        return undefined;
    }

    executionDidStart(requesPolarisGraphQLContext: GraphQLRequesPolarisGraphQLContext<PolarisGraphQLContext> & Required<Pick<GraphQLRequesPolarisGraphQLContext<PolarisGraphQLContext>, "metrics" | "source" | "document" | "operationName" | "operation">>): ((err?: Error) => void) | void {
        return undefined;
    }

    willSendResponse(requesPolarisGraphQLContext: GraphQLRequesPolarisGraphQLContext<PolarisGraphQLContext> & Required<Pick<GraphQLRequesPolarisGraphQLContext<PolarisGraphQLContext>, "metrics" | "response">>): Promise<void> | void {
        return undefined;
    }
    
    
}
