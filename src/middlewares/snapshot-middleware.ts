import { PolarisGraphQLContext } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';

export class SnapshotMiddleware {
    public readonly logger: PolarisGraphQLLogger;

    constructor(logger: PolarisGraphQLLogger) {
        this.logger = logger;
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

            if (context.requestHeaders.snapRequest) {
                if (context.snapshotContext == null) {
                    const count = await result.totalCount();
                    startIndex = 0;
                    countPerPage = context.requestHeaders.snapPageSize!;
                    context.returnedExtensions.totalCount = count;
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
