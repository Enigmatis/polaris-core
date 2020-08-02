import { PolarisGraphQLContext, RealitiesHolder } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { PolarisConnectionManager } from '@enigmatis/polaris-typeorm';
import {
    ApolloServerPlugin,
    GraphQLRequestContext,
    GraphQLRequestListener,
} from 'apollo-server-plugin-base';
import { SnapshotConfiguration } from '../..';
import { SnapshotListener } from './snapshot-listener';

export class SnapshotPlugin implements ApolloServerPlugin<PolarisGraphQLContext> {
    constructor(
        private readonly logger: PolarisGraphQLLogger,
        private readonly realitiesHolder: RealitiesHolder,
        private readonly snapshotConfiguration: SnapshotConfiguration,
        private readonly connectionManager: PolarisConnectionManager,
    ) {}

    public requestDidStart(
        requestContext: GraphQLRequestContext<PolarisGraphQLContext>,
    ): GraphQLRequestListener<PolarisGraphQLContext> | void {
        return new SnapshotListener(
            this.logger,
            this.realitiesHolder,
            this.snapshotConfiguration,
            this.connectionManager,
        );
    }
}
