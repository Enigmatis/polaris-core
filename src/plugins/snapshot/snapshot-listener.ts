import { PolarisGraphQLContext, RealitiesHolder } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import {
    getConnectionForReality,
    getPolarisConnectionManager,
    SnapshotPage,
} from '@enigmatis/polaris-typeorm';
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
import { PolarisServer, SnapshotConfiguration } from '../..';
import { SnapshotPlugin } from './snapshot-plugin';

export class SnapshotListener implements GraphQLRequestListener<PolarisGraphQLContext> {
    private readonly logger: PolarisGraphQLLogger;
    private readonly realitiesHolder: RealitiesHolder;
    private readonly snapshotConfiguration: SnapshotConfiguration;
    private readonly httpQueryOptions: GraphQLOptions;

    public constructor(
        logger: PolarisGraphQLLogger,
        realitiesHolder: RealitiesHolder,
        snapshotConfiguration: SnapshotConfiguration,
        polarisServer: PolarisServer,
        graphQLSchema: GraphQLSchema,
    ) {
        this.logger = logger;
        this.snapshotConfiguration = snapshotConfiguration;
        this.realitiesHolder = realitiesHolder;

        const plugins = polarisServer.getPlugins();
        remove(plugins, (plugin: ApolloServerPlugin) => plugin instanceof SnapshotPlugin);

        this.httpQueryOptions = {
            ...polarisServer.apolloServer.requestOptions,
            plugins,
            schema: graphQLSchema,
        };
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
        const { context } = requestContext;

        if (!context.requestHeaders.snapRequest) {
            return;
        }
        return (async (): Promise<void> => {
            const { requestHeaders } = context;
            const snapshotRepository = getConnectionForReality(
                requestHeaders.realityId!,
                this.realitiesHolder,
                getPolarisConnectionManager() as any,
            ).getRepository(SnapshotPage);
            const pagesIds: string[] = [];

            do {
                const httpRequest = requestContext.request.http!;
                const currentPageResult = await runHttpQuery([], {
                    method: httpRequest.method,
                    request: httpRequest,
                    query: requestContext.request,
                    options: {
                        ...this.httpQueryOptions,
                        context,
                    },
                });

                if (!context.snapshotContext) {
                    const totalCount = JSON.parse(currentPageResult.graphqlResponse).extensions
                        .totalCount;
                    context.snapshotContext = {
                        totalCount,
                        startIndex: 0,
                        countPerPage: requestHeaders.snapPageSize
                            ? Math.min(
                                  this.snapshotConfiguration.maxPageSize,
                                  requestHeaders.snapPageSize,
                              )
                            : this.snapshotConfiguration.maxPageSize,
                    };
                }

                const snapshotPage = new SnapshotPage(currentPageResult.graphqlResponse);
                await snapshotRepository.save({} as any, snapshotPage);
                pagesIds.push(snapshotPage.getId());

                context.snapshotContext.startIndex! += context.snapshotContext.countPerPage!;
            } while (context.snapshotContext.startIndex! < context.snapshotContext.totalCount!);

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
        const { context } = requestContext;

        if (context.requestHeaders.snapRequest) {
            return {
                data: null,
            };
        }

        return null;
    }
}
