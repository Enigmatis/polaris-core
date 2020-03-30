import { PolarisGraphQLContext } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { getPolarisConnectionManager, SnapshotPage } from '@enigmatis/polaris-typeorm';
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

    public constructor(
        logger: PolarisGraphQLLogger,
        polarisServer: PolarisServer,
        graphQLSchema: GraphQLSchema,
    ) {
        this.logger = logger;
        this.httpQueryOptions = {
            ...polarisServer.apolloServer.requestOptions,
            plugins: polarisServer.getPlugins(),
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
        if (
            !requestContext.context.requestHeaders.snapRequest ||
            requestContext.request.operationName === 'IntrospectionQuery'
        ) {
            return;
        }
        return (async (): Promise<void> => {
            const { context } = requestContext;
            const { requestHeaders } = context;
            const snapshotRepository = getPolarisConnectionManager()
                .get()
                .getRepository(SnapshotPage);
            const pagesIds = [];

            do {
                const currentPageResult = await runHttpQuery([], {
                    method: requestContext.request.http?.method!,
                    query: { ...requestContext.request },
                    options: {
                        ...this.httpQueryOptions,
                        context,
                    },
                    request: requestContext.request.http!,
                });

                if (!context.snapshotContext) {
                    const totalCount = JSON.parse(currentPageResult.graphqlResponse).extensions
                        .totalCount;

                    context.snapshotContext = {
                        totalCount,
                        startIndex: 0,
                        countPerPage: requestHeaders.snapPageSize!,
                    };
                }

                const snapshotPage = new SnapshotPage(currentPageResult.graphqlResponse);
                await snapshotRepository.save({} as any, snapshotPage);
                pagesIds.push(snapshotPage.getId());

                context.snapshotContext!.startIndex! += context.snapshotContext!.countPerPage!;
            } while (context.snapshotContext?.startIndex! < context.snapshotContext?.totalCount!);

            context.returnedExtensions.snapResponse = { pagesIds };
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
        if (
            !requestContext.context.requestHeaders.snapRequest ||
            requestContext.request.operationName === 'IntrospectionQuery'
        ) {
            return null;
        }
        return {
            data: null,
        };
    }
}
