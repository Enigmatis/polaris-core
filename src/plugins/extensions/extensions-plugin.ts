import { PolarisGraphQLContext } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import {
    ApolloServerPlugin,
    GraphQLRequestContext,
    GraphQLRequestListener,
} from 'apollo-server-plugin-base';
import { ExtensionsListener } from './extensions-listener';

export class ExtensionsPlugin implements ApolloServerPlugin<PolarisGraphQLContext> {
    private readonly extensionsListener: ExtensionsListener;

    public constructor(logger: PolarisGraphQLLogger, shouldAddWarningsToExtensions: boolean) {
        this.extensionsListener = new ExtensionsListener(logger, shouldAddWarningsToExtensions);
    }

    public requestDidStart(
        requestContext: GraphQLRequestContext<PolarisGraphQLContext>,
    ): GraphQLRequestListener<PolarisGraphQLContext> | void {
        return this.extensionsListener;
    }
}
