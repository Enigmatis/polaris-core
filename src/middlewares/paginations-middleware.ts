import { PolarisGraphQLContext } from '@enigmatis/polaris-common';

export class PaginationMiddleware {
    public getMiddleware() {
        return async (
            resolve: any,
            root: any,
            args: any,
            context: PolarisGraphQLContext,
            info: any,
        ) => {
            const result = await resolve(root, args, context, info);
            if (!(result.totalCount && result.getData)) {
                return result;
            }

            if(context.snapshotContext == null){
                const count = await result.totalCount();
                context.snapshotContext = {
                    totalCount: count,
                    startIndex: 0,
                    countPerPage: count / context.requestHeaders.snapPageSize!
                };
            }

            return result.getData(context.snapshotContext.startIndex!, context.snapshotContext.countPerPage!);
        };
    }
}
