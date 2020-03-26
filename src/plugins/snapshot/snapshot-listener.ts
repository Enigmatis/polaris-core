import { PolarisGraphQLContext } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { runHttpQuery } from 'apollo-server-core';
import { GraphQLOptions } from 'apollo-server-express';
import {
    ApolloServerPlugin,
    GraphQLRequestContext,
    GraphQLRequestListener,
    GraphQLResponse,
} from 'apollo-server-plugin-base';
import { GraphQLSchema } from 'graphql';
import { remove } from 'lodash';
import { PolarisServer } from '../..';
import { SnapshotPlugin } from './snapshot-plugin';

export class SnapshotListener implements GraphQLRequestListener<PolarisGraphQLContext> {
    private readonly logger: PolarisGraphQLLogger;
    private readonly httpQueryOptions: GraphQLOptions;
    private dataWaited: any;

    public constructor(
        logger: PolarisGraphQLLogger,
        polarisServer: PolarisServer,
        graphQLSchema: GraphQLSchema,
    ) {
        this.logger = logger;
        this.httpQueryOptions = {
            ...polarisServer.apolloServer.requestOptions,
            plugins: polarisServer.getPlugins() ,
            schema: graphQLSchema,
        };
        remove(
            this.httpQueryOptions.plugins!,
            (x: ApolloServerPlugin) => x instanceof SnapshotPlugin,
        );
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
                    ...this.httpQueryOptions,
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
}
