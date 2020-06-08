import { PolarisGraphQLContext, RealitiesHolder } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { isMutation } from '@enigmatis/polaris-middlewares';
import {
    getConnectionForReality,
    PolarisConnectionManager,
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

    public constructor(
        private readonly logger: PolarisGraphQLLogger,
        private readonly realitiesHolder: RealitiesHolder,
        private readonly snapshotConfiguration: SnapshotConfiguration,
        private readonly connectionManager: PolarisConnectionManager,
    ) {}

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

        if (
            (!context.requestHeaders.snapRequest && !this.snapshotConfiguration.autoSnapshot) ||
            isMutation(requestContext.request.query)
        ) {
            return;
        }

        return (async (): Promise<void> => {
            const { requestHeaders } = context;
            const snapshotRepository = getConnectionForReality(
                requestHeaders.realityId!,
                this.realitiesHolder as any,
                this.connectionManager,
            ).getRepository(SnapshotPage);
            const pagesIds: string[] = [];

            let currentPageIndex = 0;
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

                const parsedResult = JSON.parse(currentPageResult.graphqlResponse);

                if (!context.snapshotContext) {
                    const totalCount = parsedResult.extensions.totalCount;
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
                        context.returnedExtensions.globalDataVersion =
                            parsedResult.extensions.globalDataVersion;
                    } else {
                        return;
                    }
                }

                context.snapshotContext!.prefetchBuffer = parsedResult.extensions.prefetchBuffer;
                delete parsedResult.extensions.prefetchBuffer;
                const snapshotPage = new SnapshotPage(JSON.stringify(parsedResult));
                await snapshotRepository.save({} as any, snapshotPage);
                pagesIds.push(snapshotPage.getId());
                context.snapshotContext!.startIndex! += context.snapshotContext!.countPerPage!;
                currentPageIndex++;
            } while (
                currentPageIndex <
                context.snapshotContext!.totalCount! / context.snapshotContext!.countPerPage!
            );

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
