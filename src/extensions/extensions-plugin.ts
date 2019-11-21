import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import {
    ApolloServerPlugin,
    GraphQLRequestContext,
    GraphQLRequestListener,
} from 'apollo-server-plugin-base';
import { ExtensionsListener } from './extensions-listener';

export class ExtensionsPlugin implements ApolloServerPlugin {
    public readonly logger: any;

    constructor(logger: PolarisGraphQLLogger) {
        this.logger = logger;
    }

    public requestDidStart<TContext>(
        requestContext: GraphQLRequestContext<TContext>,
    ): GraphQLRequestListener<TContext> | void {
        return new ExtensionsListener(this.logger);
    }
}
