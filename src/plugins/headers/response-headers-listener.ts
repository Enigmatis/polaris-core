import {
    OICD_CLAIM_UPN,
    PolarisGraphQLContext,
    REALITY_ID,
    REQUEST_ID,
} from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import {
    GraphQLRequestContext,
    GraphQLRequestListener,
    ValueOrPromise,
    WithRequired,
} from 'apollo-server-plugin-base';

export class ResponseHeadersListener implements GraphQLRequestListener<PolarisGraphQLContext> {
    public readonly logger: any;

    constructor(logger: PolarisGraphQLLogger) {
        this.logger = logger;
    }

    public willSendResponse(
        requestContext: WithRequired<
            GraphQLRequestContext<PolarisGraphQLContext>,
            'metrics' | 'response'
        >,
    ): ValueOrPromise<void> {
        const { context } = requestContext;
        if (context.responseHeaders) {
            const requestId = context.responseHeaders.requestId;
            if (requestId) {
                requestContext.response.http?.headers.set(REQUEST_ID, requestId);
            }
            const realityId = context.responseHeaders.realityId;
            if (realityId !== undefined && Number.isInteger(realityId)) {
                requestContext.response.http?.headers.set(REALITY_ID, String(realityId));
            }
            const upn = context.responseHeaders.upn;
            if (upn) {
                requestContext.response.http?.headers.set(OICD_CLAIM_UPN, upn);
            }
            this.logger.debug('response headers were set to response');
        }
    }
}
