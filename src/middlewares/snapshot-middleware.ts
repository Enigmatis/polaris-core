import { PolarisGraphQLContext } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { SnapshotConfiguration } from '..';

export class SnapshotMiddleware {
    public readonly logger: PolarisGraphQLLogger;
    public readonly snapshotConfiguration: SnapshotConfiguration;

    constructor(logger: PolarisGraphQLLogger, snapshotConfiguration: SnapshotConfiguration) {
        this.logger = logger;
        this.snapshotConfiguration = snapshotConfiguration;
    }

    public getMiddleware() {
        return async (
            resolve: any,
            root: any,
            args: any,
            context: PolarisGraphQLContext,
            info: any,
        ) => {
            this.logger.debug('Snapshot middleware started job', context);
            let startIndex: number;
            let countPerPage: number;
            let currentPage: any[];
            const result = await resolve(root, args, context, info);

            if (!(result && result.totalCount && result.getData && !root)) {
                return result;
            }

            if (context.requestHeaders.snapRequest || this.snapshotConfiguration.autoSnapshot) {
                if (context.snapshotContext == null) {
                    countPerPage = await this.calculateCountPerPage(result, context);
                    startIndex = 0;
                } else {
                    startIndex = context.snapshotContext.startIndex!;
                    countPerPage = context.snapshotContext.countPerPage!;
                }

                currentPage = await this.fetchEntitiesWithBuffer(
                    context,
                    result,
                    startIndex,
                    countPerPage,
                );
            } else {
                currentPage = await result.getData(0, undefined);
            }

            this.logger.debug('Snapshot middleware finished job', context);
            return currentPage;
        };
    }

    private async calculateCountPerPage(result: any, context: PolarisGraphQLContext) {
        let countPerPage = context.requestHeaders.snapPageSize
            ? Math.min(this.snapshotConfiguration.maxPageSize, context.requestHeaders.snapPageSize)
            : this.snapshotConfiguration.maxPageSize;

        countPerPage = await this.setCalculatePerPageAccordingToTotalCount(result, countPerPage, context);

        return countPerPage;
    }

    private async setCalculatePerPageAccordingToTotalCount(result: any, countPerPage: number, context: PolarisGraphQLContext) {
        const totalCount = await result.totalCount();

        if (this.snapshotConfiguration.autoSnapshot) {
            if (totalCount > countPerPage) {
                context.returnedExtensions.totalCount = totalCount;
            } else {
                countPerPage = totalCount;
            }
        } else if (context.requestHeaders.snapRequest) {
            context.returnedExtensions.totalCount = totalCount;
        }

        return countPerPage;
    }

    private async fetchEntitiesWithBuffer(
        context: PolarisGraphQLContext,
        result: any,
        startIndex: number,
        countPerPage: number,
    ) {
        let prefetchBuffer = context.snapshotContext?.prefetchBuffer || [];

        if (prefetchBuffer.length < countPerPage) {
            const fetchedData = await this.fetchMoreDataForBuffer(result, startIndex, countPerPage);
            prefetchBuffer = [...prefetchBuffer, ...(fetchedData || [])];
        }

        const currentPage = prefetchBuffer.splice(0, countPerPage);

        if (prefetchBuffer.length > 0) {
            context.returnedExtensions.prefetchBuffer = prefetchBuffer;
        } else {
            delete context.returnedExtensions.prefetchBuffer;
        }

        return currentPage;
    }

    private fetchMoreDataForBuffer(result: any, startIndex: number, countPerPage: number) {
        return result.getData(
            startIndex,
            countPerPage > this.snapshotConfiguration.entitiesAmountPerFetch
                ? countPerPage
                : this.snapshotConfiguration.entitiesAmountPerFetch,
        );
    }
}
