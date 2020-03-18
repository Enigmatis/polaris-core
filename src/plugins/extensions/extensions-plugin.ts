import { PolarisGraphQLContext } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import {
    ApolloServerPlugin,
    GraphQLRequestContext,
    GraphQLRequestListener,
} from 'apollo-server-plugin-base';
import { ExtensionsListener } from './extensions-listener';

export class ExtensionsPlugin implements ApolloServerPlugin<PolarisGraphQLContext> {
    public readonly logger: PolarisGraphQLLogger;
    public readonly shouldAddWarningsToExtensions: boolean;

    constructor(logger: PolarisGraphQLLogger, shouldAddWarningsToExtensions: boolean) {
        this.logger = logger;
        this.shouldAddWarningsToExtensions = shouldAddWarningsToExtensions;
    }

    public requestDidStart(
        requestContext: GraphQLRequestContext<PolarisGraphQLContext>,
    ): GraphQLRequestListener<PolarisGraphQLContext> | void {
        return new ExtensionsListener(this.logger, this.shouldAddWarningsToExtensions);
    }
}
