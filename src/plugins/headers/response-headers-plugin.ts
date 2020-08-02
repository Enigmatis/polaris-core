import { PolarisGraphQLContext } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import {
    ApolloServerPlugin,
    GraphQLRequestContext,
    GraphQLRequestListener,
} from 'apollo-server-plugin-base';
import { ResponseHeadersListener } from './response-headers-listener';

export class ResponseHeadersPlugin implements ApolloServerPlugin<PolarisGraphQLContext> {
    public readonly logger: any;

    constructor(logger: PolarisGraphQLLogger) {
        this.logger = logger;
    }

    public requestDidStart(
        requestContext: GraphQLRequestContext<PolarisGraphQLContext>,
    ): GraphQLRequestListener<PolarisGraphQLContext> | void {
        return new ResponseHeadersListener(this.logger);
    }
}
