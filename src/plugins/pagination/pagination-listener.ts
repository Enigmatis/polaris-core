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
    private dataWaited: any;

    constructor(logger: PolarisGraphQLLogger, apollo: PolarisServer) {
        this.logger = logger;
        this.polarisServer = apollo;
        this.optionsToSend = cloneDeep(this.polarisServer.apolloServer.requestOptions);

        this.optionsToSend.plugins = this.polarisServer.getApolloServerConfigurations()
            .plugins as ApolloServerPlugin[];
        remove(
            this.optionsToSend.plugins!,
            (x: ApolloServerPlugin) => x instanceof PaginationPlugin,
        );
        this.graphQLSchema = this.polarisServer.getSchemaWithMiddlewares();
    }

    public didResolveOperation(
        requestContext: GraphQLRequestContext<PolarisGraphQLContext> &
            Required<
                Pick<
                    GraphQLRequestContext<PolarisGraphQLContext>,
                    'metrics' | 'source' | 'document' | 'operationName' | 'operation'
                >
            >,
    ): Promise<void> | void {
        return (async (): Promise<void> => {
            const result = await runHttpQuery([], {
                method: requestContext.request.http?.method!,
                query: { ...requestContext.request },
                options: {
                    ...this.optionsToSend,
                    schema: this.graphQLSchema,
                    context: requestContext.context,
                },
                request: requestContext.request.http!,
            });
            this.dataWaited = result;
        })();
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
        const headersToSend: { [name: string]: string } = {};
        headersToSend.lol = 'shit';
        const datato = this.dataWaited;
        return {
            data: null,
        };
    }

    // );
}
