import {
    OICD_CLAIM_UPN,
    PolarisGraphQLContext,
    REALITY_ID,
    REQUEST_ID,
} from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { GraphQLRequestListener } from 'apollo-server-plugin-base';

export class ResponseHeadersListener implements GraphQLRequestListener {
    public readonly logger: any;

    constructor(logger: PolarisGraphQLLogger) {
        this.logger = logger;
    }

    public async willSendResponse(requestContext: any) {
        const { context }: { context: PolarisGraphQLContext } = requestContext;
        if (context.responseHeaders) {
            this.logger.debug('response headers were set to response');
            if (context.responseHeaders.requestId) {
                requestContext.response.http.headers.set(
                    REQUEST_ID,
                    context.responseHeaders.requestId,
                );
            }
            if (context.responseHeaders.realityId) {
                requestContext.response.http.headers.set(
                    REALITY_ID,
                    context.responseHeaders.realityId,
                );
            }
            if (context.responseHeaders.upn) {
                requestContext.response.http.headers.set(
                    OICD_CLAIM_UPN,
                    context.responseHeaders.upn,
                );
            }
        }

        return requestContext;
    }
}
