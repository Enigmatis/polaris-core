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

            const pageCount = Math.ceil(
                context.snapshotContext!.totalCount! / context.snapshotContext!.countPerPage!,
            );
            const snapshotPages: SnapshotPage[] = Array(pageCount)
                .fill(0)
                .map(this.generateUUIDAndCreateSnapshotPage);
            const pagesIds = snapshotPages.map((snapPage: SnapshotPage) => snapPage.getId());
            await snapshotRepository.save({} as any, snapshotPages);
            const irrelevantEntitiesOfPages: IrrelevantEntitiesResponse[] = [];
            snapshotMetadata.setPageIds(pagesIds);
            snapshotMetadata.setDataVersion(context.returnedExtensions.globalDataVersion);
            snapshotMetadata.setTotalCount(context.snapshotContext?.totalCount!);
            snapshotMetadata.setPagesCount(pageCount);
            await snapshotMetadataRepository.save({} as any, snapshotMetadata);
            const clonedContext = cloneDeep(context);
            this.executeSnapshotPagination(
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

    private async executeSnapshotPagination(
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
        await this.handleSnapshotOperation(
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
            const parsedResult = this.sendQueryRequest(requestContext, context);
            await this.handleSnapshotOperation(
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
        this.completeSnapshotMetadataFields(snapshotMetadata, mergedIrrelevantEntities);
        await snapshotMetadataRepository.save({} as any, snapshotMetadata);
    }

    private completeSnapshotMetadataFields(
        snapshotMetadata: SnapshotMetadata,
        mergedIrrelevantEntities: IrrelevantEntitiesResponse | undefined,
    ) {
        snapshotMetadata.setIrrelevantEntities(JSON.stringify(mergedIrrelevantEntities));
        snapshotMetadata.setCurrentPageIndex(null as any);
        snapshotMetadata.setSnapshotStatus(SnapshotStatus.DONE);
    }

    private generateUUIDAndCreateSnapshotPage(): SnapshotPage {
        const uuid = uuidv4();
        return new SnapshotPage(uuid);
    }

    private async handleSnapshotOperation(
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
        await this.saveResultToSnapshot(parsedResult, snapshotRepository, snapshotPage);
        snapshotMetadata.setCurrentPageIndex(snapshotMetadata.getCurrentPageIndex() + 1);
        await snapshotMetadataRepository.save({} as any, snapshotMetadata);
    }

    private async saveResultToSnapshot(
        parsedResult: any,
        snapshotRepository: PolarisRepository<SnapshotPage>,
        snapshotPage: SnapshotPage,
    ): Promise<void> {
        snapshotPage.setData(JSON.stringify(parsedResult));
        snapshotPage.setStatus(SnapshotStatus.DONE);
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
