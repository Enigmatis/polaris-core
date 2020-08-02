import {
    IrrelevantEntitiesResponse,
    mergeIrrelevantEntities,
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
    QueryRunner,
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
import { cloneDeep } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { SnapshotConfiguration } from '../..';

export class SnapshotListener implements GraphQLRequestListener<PolarisGraphQLContext> {
    public static graphQLOptions: any;

    private static getRealityFromHeaders(context: PolarisGraphQLContext): number {
        return context.requestHeaders.realityId !== undefined
            ? context.requestHeaders.realityId
            : 0;
    }

    private static completeSnapshotMetadataFields(
        snapshotMetadata: SnapshotMetadata,
        mergedIrrelevantEntities: IrrelevantEntitiesResponse | undefined,
    ) {
        snapshotMetadata.setIrrelevantEntities(JSON.stringify(mergedIrrelevantEntities));
        snapshotMetadata.setCurrentPageIndex(null as any);
        snapshotMetadata.setSnapshotStatus(SnapshotStatus.DONE);
    }

    private static generateUUIDAndCreateSnapshotPage(): SnapshotPage {
        const uuid = uuidv4();
        return new SnapshotPage(uuid);
    }

    private static async saveResultToSnapshot(
        parsedResult: any,
        snapshotRepository: PolarisRepository<SnapshotPage>,
        snapshotPage: SnapshotPage,
    ): Promise<void> {
        snapshotPage.setData(JSON.stringify(parsedResult));
        snapshotPage.setStatus(SnapshotStatus.DONE);
        await snapshotRepository.save({} as any, snapshotPage);
    }

    private static async sendQueryRequest(
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

    private static async executeSnapshotPagination(
        context: PolarisGraphQLContext,
        firstRequest: any,
        snapshotRepository: PolarisRepository<SnapshotPage>,
        snapshotMetadataRepository: PolarisRepository<SnapshotMetadata>,
        snapshotMetadata: SnapshotMetadata,
        snapshotPages: SnapshotPage[],
        irrelevantEntitiesOfPages: IrrelevantEntitiesResponse[],
        pageCount: number,
        requestContext: GraphQLRequestContext<PolarisGraphQLContext> &
            Required<
                Pick<
                    GraphQLRequestContext<PolarisGraphQLContext>,
                    'metrics' | 'source' | 'document' | 'operationName' | 'operation'
                >
            >,
    ) {
        let currentPageIndex: number = 0;
        await SnapshotListener.handleSnapshotOperation(
            context,
            firstRequest,
            snapshotRepository,
            snapshotMetadataRepository,
            snapshotMetadata,
            snapshotPages[currentPageIndex],
            irrelevantEntitiesOfPages,
        );
        context.snapshotContext!.startIndex! += context.snapshotContext!.countPerPage!;
        ++currentPageIndex;
        while (currentPageIndex < pageCount) {
            const parsedResult = SnapshotListener.sendQueryRequest(requestContext, context);
            await SnapshotListener.handleSnapshotOperation(
                context,
                parsedResult,
                snapshotRepository,
                snapshotMetadataRepository,
                snapshotMetadata,
                snapshotPages[currentPageIndex],
                irrelevantEntitiesOfPages,
            );
            context.snapshotContext!.startIndex! += context.snapshotContext!.countPerPage!;
            currentPageIndex++;
        }
        const mergedIrrelevantEntities:
            | IrrelevantEntitiesResponse
            | undefined = mergeIrrelevantEntities(irrelevantEntitiesOfPages);
        SnapshotListener.completeSnapshotMetadataFields(snapshotMetadata, mergedIrrelevantEntities);
        await snapshotMetadataRepository.save({} as any, snapshotMetadata);
    }

    private static async handleSnapshotOperation(
        context: PolarisGraphQLContext,
        resultPromise: Promise<any>,
        snapshotRepository: PolarisRepository<SnapshotPage>,
        snapshotMetadataRepository: PolarisRepository<SnapshotMetadata>,
        snapshotMetadata: SnapshotMetadata,
        snapshotPage: SnapshotPage,
        irrelevantEntities: IrrelevantEntitiesResponse[],
    ) {
        const parsedResult = await resultPromise;
        context.snapshotContext!.prefetchBuffer = parsedResult.extensions.prefetchBuffer;
        delete parsedResult.extensions.prefetchBuffer;
        if (parsedResult.extensions.irrelevantEntities) {
            irrelevantEntities.push(parsedResult.extensions.irrelevantEntities);
            delete parsedResult.extensions.irrelevantEntities;
        }
        snapshotMetadata.addWarnings(parsedResult.extensions.warnings);
        snapshotMetadata.addErrors(parsedResult.extensions.errors);
        await SnapshotListener.saveResultToSnapshot(parsedResult, snapshotRepository, snapshotPage);
        snapshotMetadata.setCurrentPageIndex(snapshotMetadata.getCurrentPageIndex() + 1);
        await snapshotMetadataRepository.save({} as any, snapshotMetadata);
    }

    private static async failSnapshotMetadata(
        snapshotMetadataRepository: PolarisRepository<SnapshotMetadata>,
        snapshotMetadata: SnapshotMetadata,
        error: Error,
    ) {
        snapshotMetadata.setSnapshotStatus(SnapshotStatus.FAILED);
        snapshotMetadata.setPageIds([]);
        snapshotMetadata.addErrors(error.message);
        await snapshotMetadataRepository.save({} as any, snapshotMetadata);
    }

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
            const firstRequest = await SnapshotListener.sendQueryRequest(requestContext, context);

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

            const pageCount = Math.ceil(
                context.snapshotContext!.totalCount! / context.snapshotContext!.countPerPage!,
            );
            const snapshotPages: SnapshotPage[] = Array(pageCount)
                .fill(0)
                .map(SnapshotListener.generateUUIDAndCreateSnapshotPage);
            const pagesIds = snapshotPages.map((snapPage: SnapshotPage) => snapPage.getId());
            await snapshotRepository.save({} as any, snapshotPages);
            const irrelevantEntitiesOfPages: IrrelevantEntitiesResponse[] = [];
            snapshotMetadata.setPageIds(pagesIds);
            snapshotMetadata.setDataVersion(context.returnedExtensions.globalDataVersion);
            snapshotMetadata.setTotalCount(context.snapshotContext?.totalCount!);
            snapshotMetadata.setPagesCount(pageCount);
            await snapshotMetadataRepository.save({} as any, snapshotMetadata);
            const clonedContext = cloneDeep(context);
            const queryRunner = this.getQueryRunner(requestContext.context);
            let transactionStarted = false;
            if (!queryRunner.isTransactionActive) {
                await queryRunner.startTransaction();
                transactionStarted = true;
            }
            try {
                SnapshotListener.executeSnapshotPagination(
                    clonedContext,
                    firstRequest,
                    snapshotRepository,
                    snapshotMetadataRepository,
                    snapshotMetadata,
                    snapshotPages,
                    irrelevantEntitiesOfPages,
                    pageCount,
                    requestContext,
                );
            } catch (e) {
                await queryRunner.rollbackTransaction();
                SnapshotListener.failSnapshotMetadata(
                    snapshotMetadataRepository,
                    snapshotMetadata,
                    e,
                );
                this.logger.error('Error in snapshot process', context, {
                    throwable: e,
                });
                throw e;
            }
            if (transactionStarted) {
                await queryRunner.commitTransaction();
            }
            requestContext.context.returnedExtensions.snapResponse = {
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

    private getQueryRunner(context: PolarisGraphQLContext): QueryRunner {
        return getConnectionForReality(
            SnapshotListener.getRealityFromHeaders(context),
            this.realitiesHolder,
            this.connectionManager,
        ).manager.queryRunner!;
    }
}
