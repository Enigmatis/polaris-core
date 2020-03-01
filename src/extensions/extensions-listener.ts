import { PolarisGraphQLContext } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { GraphQLRequestContext, GraphQLRequestListener } from 'apollo-server-plugin-base';

export class ExtensionsListener implements GraphQLRequestListener<PolarisGraphQLContext> {
    public readonly logger: any;

    constructor(logger: PolarisGraphQLLogger) {
        this.logger = logger;
    }

    public async willSendResponse(
        requestContext: GraphQLRequestContext<PolarisGraphQLContext> &
            Required<Pick<GraphQLRequestContext<PolarisGraphQLContext>, 'metrics' | 'response'>>,
    ): Promise<void> {
        const { context, response } = requestContext;

        if (context.returnedExtensions) {
            this.logger.debug('extensions were set to response');
            response.extensions = { ...response.extensions, ...context.returnedExtensions };
        }
    }
}
