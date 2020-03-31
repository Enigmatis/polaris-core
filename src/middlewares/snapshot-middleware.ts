import { PolarisGraphQLContext } from '@enigmatis/polaris-common';

export class SnapshotMiddleware {
    public getMiddleware() {
        return async (
            resolve: any,
            root: any,
            args: any,
            context: PolarisGraphQLContext,
            info: any,
        ) => {
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

            return result.getData(startIndex, countPerPage);
        };
    }
}
