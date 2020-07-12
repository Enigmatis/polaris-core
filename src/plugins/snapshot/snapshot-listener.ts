import {
    PolarisGraphQLContext,
    PolarisRequestHeaders,
    RealitiesHolder,
} from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { isMutation } from '@enigmatis/polaris-middlewares';
import {
    getConnectionForReality,
    PolarisConnectionManager,
    PolarisRepository,
    SnapshotMetadata,
    SnapshotPage,
    SnapshotStatus,
} from '@enigmatis/polaris-typeorm';
import { runHttpQuery } from 'apollo-server-core';
import {
    GraphQLRequestContext,
    GraphQLRequestListener,
    GraphQLResponse,
} from 'apollo-server-plugin-base';
import { v4 as uuidv4 } from 'uuid';
import { SnapshotConfiguration } from '../..';

export class SnapshotListener implements GraphQLRequestListener<PolarisGraphQLContext> {
    public static graphQLOptions: any;

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
            const connection = getConnectionForReality(
                requestHeaders.realityId!,
                this.realitiesHolder as any,
                this.connectionManager,
            );
            const snapshotRepository = connection.getRepository(SnapshotPage);
            const snapshotMetadataRepository = connection.getRepository(SnapshotMetadata);
            const snapshotMetadata = new SnapshotMetadata();
            await snapshotMetadataRepository.save({} as any, snapshotMetadata);
            let currentPageIndex: number = 0;
            const firstRequest = await this.sendQueryRequest(requestContext, context);

            if (!context.snapshotContext) {
                const totalCount = firstRequest.extensions.totalCount;
                if (totalCount != null) {
                    this.fillContextWithSnapshotMetadata(
                        context,
                        totalCount,
                        requestHeaders,
                        firstRequest,
                    );
                } else {
                    return;
                }
            }

            const pageCount =
                context.snapshotContext!.totalCount! / context.snapshotContext!.countPerPage!;
            const pagesIds: string[] = Array(pageCount)
                .fill(0)
                .map(function generateUUID() {
                    return uuidv4();
                });
            snapshotMetadata.setPageIds(pagesIds);
            snapshotMetadata.setDataVersion(context.returnedExtensions.globalDataVersion);
            snapshotMetadata.setTotalCount(context.snapshotContext?.totalCount!);
            snapshotMetadata.setTotalPagesCount(pageCount);
            await snapshotMetadataRepository.save({} as any , snapshotMetadata);
            this.handleSnapshotOperation(
                context,
                firstRequest,
                snapshotRepository,
                snapshotMetadataRepository,
                snapshotMetadata,
                pagesIds[currentPageIndex],
            );
            ++currentPageIndex;
            while (currentPageIndex < pageCount) {
                const parsedResult = await this.sendQueryRequest(requestContext, context);
                this.handleSnapshotOperation(
                    context,
                    parsedResult,
                    snapshotRepository,
                    snapshotMetadataRepository,
                    snapshotMetadata,
                    pagesIds[currentPageIndex],
                );
                currentPageIndex++;
            }
            snapshotMetadataRepository.save({} as any, snapshotMetadata);
            context.returnedExtensions.snapResponse = {
                snapshotMetadataId: snapshotMetadata.getId(),
                pagesIds,
            };
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

    private async handleSnapshotOperation(
        context: PolarisGraphQLContext,
        parsedResult: any,
        snapshotRepository: PolarisRepository<SnapshotPage>,
        snapshotMetadataRepository: PolarisRepository<SnapshotMetadata>,
        snapshotMetadata: SnapshotMetadata,
        pagesId: string,
    ) {
        context.snapshotContext!.prefetchBuffer = parsedResult.extensions.prefetchBuffer;
        delete parsedResult.extensions.prefetchBuffer;
        snapshotMetadata.addIrrelevantEntities(parsedResult.extensions.irrelevantEntities);
        snapshotMetadata.addWarnings(parsedResult.extensions.warnings);
        snapshotMetadata.addErrors(parsedResult.extensions.errors);
        await this.saveResultToSnapshot(parsedResult, snapshotRepository, pagesId);
        context.snapshotContext!.startIndex! += context.snapshotContext!.countPerPage!;
        snapshotMetadata.setCurrentPageCount(snapshotMetadata.getCurrentPageCount() + 1);
        if (snapshotMetadata.getCurrentPageCount() === snapshotMetadata.getTotalPagesCount()) {
            snapshotMetadata.setSnapshotStatus(SnapshotStatus.DONE);
        }
        await snapshotMetadataRepository.save({} as any, snapshotMetadata);
    }

    private async saveResultToSnapshot(
        parsedResult: any,
        snapshotRepository: PolarisRepository<SnapshotPage>,
        pageId: string,
    ): Promise<void> {
        const snapshotPage = new SnapshotPage(pageId, JSON.stringify(parsedResult));
        await snapshotRepository.save({} as any, snapshotPage);
    }

    private async sendQueryRequest(
        requestContext: GraphQLRequestContext<PolarisGraphQLContext> &
            Required<
                Pick<
                    GraphQLRequestContext<PolarisGraphQLContext>,
                    'metrics' | 'source' | 'document' | 'operationName' | 'operation'
                >
            >,
        context: PolarisGraphQLContext,
    ) {
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
        return JSON.parse(currentPageResult.graphqlResponse);
    }

    private fillContextWithSnapshotMetadata(
        context: PolarisGraphQLContext,
        totalCount: number,
        requestHeaders: PolarisRequestHeaders,
        parsedResult: any,
    ) {
        context.snapshotContext = {
            totalCount,
            startIndex: 0,
            countPerPage: requestHeaders.snapPageSize
                ? Math.min(this.snapshotConfiguration.maxPageSize, requestHeaders.snapPageSize)
                : this.snapshotConfiguration.maxPageSize,
        };
        context.returnedExtensions.globalDataVersion = parsedResult.extensions.globalDataVersion;
    }
}
