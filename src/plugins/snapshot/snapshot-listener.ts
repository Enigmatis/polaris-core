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
    GraphQLRequestContext,
    GraphQLRequestListener,
    GraphQLResponse,
} from 'apollo-server-plugin-base';
import { SnapshotConfiguration } from '../..';

export class SnapshotListener implements GraphQLRequestListener<PolarisGraphQLContext> {
    public static graphQLOptions: GraphQLOptions;
    private readonly logger: PolarisGraphQLLogger;
    private readonly realitiesHolder: RealitiesHolder;
    private readonly snapshotConfiguration: SnapshotConfiguration;

    public constructor(
        logger: PolarisGraphQLLogger,
        realitiesHolder: RealitiesHolder,
        snapshotConfiguration: SnapshotConfiguration,
    ) {
        this.logger = logger;
        this.realitiesHolder = realitiesHolder;
        this.snapshotConfiguration = snapshotConfiguration;
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

        if (!context.requestHeaders.snapRequest && !this.snapshotConfiguration.autoSnapshot) {
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
                        ...SnapshotListener.graphQLOptions,
                        context,
                    },
                });

                if (!context.snapshotContext) {
                    const totalCount = JSON.parse(currentPageResult.graphqlResponse).extensions
                        .totalCount;
                    if (totalCount !== undefined) {
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
                        context.returnedExtensions.globalDataVersion = JSON.parse(
                            currentPageResult.graphqlResponse,
                        ).extensions.globalDataVersion;
                    } else {
                        return;
                    }
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

        if (context.snapshotContext) {
            return {
                data: {},
            };
        }

        return null;
    }
}
