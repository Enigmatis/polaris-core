import { PolarisGraphQLContext } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { GraphQLRequestListener } from 'apollo-server-plugin-base';

export class ExtensionsListener implements GraphQLRequestListener {
    public readonly logger: any;

    constructor(logger: PolarisGraphQLLogger) {
        this.logger = logger;
    }

    public async willSendResponse(requestContext: any) {
        const {
            context,
            response,
        }: { context: PolarisGraphQLContext; response: any } = requestContext;
        if (context.returnedExtensions) {
            this.logger.debug('extensions were set to response');
            response.extensions = context.returnedExtensions;
        }
        return requestContext;
    }
}
