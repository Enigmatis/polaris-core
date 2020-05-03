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
            let startIndex;
            let countPerPage;
            const result = await resolve(root, args, context, info);
            if (!(result && result.totalCount && result.getData && !root)) {
                return result;
            }

            if (context.requestHeaders.snapRequest || this.snapshotConfiguration.autoSnapshot) {
                if (context.snapshotContext == null) {
                    const totalCount = await result.totalCount();

                    countPerPage = context.requestHeaders.snapPageSize
                        ? Math.min(
                              this.snapshotConfiguration.maxPageSize,
                              context.requestHeaders.snapPageSize,
                          )
                        : this.snapshotConfiguration.maxPageSize;

                    if (this.snapshotConfiguration.autoSnapshot) {
                        if (totalCount > countPerPage) {
                            context.returnedExtensions.totalCount = totalCount;
                        } else {
                            countPerPage = totalCount;
                        }
                    } else if (context.requestHeaders.snapRequest) {
                        context.returnedExtensions.totalCount = totalCount;
                    }

                    startIndex = 0;
                } else {
                    startIndex = context.snapshotContext.startIndex!;
                    countPerPage = context.snapshotContext.countPerPage!;
                }
            }

            this.logger.debug('Snapshot middleware finished job', context);
            return result.getData(startIndex, countPerPage);
        };
    }
}
