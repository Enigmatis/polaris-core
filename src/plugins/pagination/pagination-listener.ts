import {PolarisGraphQLContext} from '@enigmatis/polaris-common';
import {PolarisGraphQLLogger} from '@enigmatis/polaris-graphql-logger';
import {
    ApolloServerPlugin,
    GraphQLRequestContext,
    GraphQLRequestListener,
    GraphQLResponse
} from 'apollo-server-plugin-base';
import {PolarisServer} from "../..";
import {runHttpQuery} from "apollo-server-core"
import {makeExecutablePolarisSchema} from "@enigmatis/polaris-schema";
import {GraphQLOptions} from 'apollo-server-express';
import {cloneDeep, remove} from 'lodash';
import {PaginationPlugin} from "./pagination-plugin";
import {GraphQLSchema} from 'graphql';

export class PaginationListener implements GraphQLRequestListener<PolarisGraphQLContext> {
    private logger: PolarisGraphQLLogger;
    private polarisServer: PolarisServer;
    private optionsToSend: Partial<GraphQLOptions>;
    private graphQLSchema: GraphQLSchema;

    constructor(logger: PolarisGraphQLLogger, apollo: PolarisServer) {
        this.logger = logger;
        this.polarisServer = apollo;
        this.optionsToSend = cloneDeep(this.polarisServer.apolloServer.requestOptions);
        remove(this.optionsToSend.plugins!, (x: ApolloServerPlugin) => x instanceof PaginationPlugin);
        this.graphQLSchema = makeExecutablePolarisSchema(this.polarisServer.polarisServerConfig.typeDefs, this.polarisServer.polarisServerConfig.resolvers);
    }

    responseForOperation(requestContext: GraphQLRequestContext<PolarisGraphQLContext> & Required<Pick<GraphQLRequestContext<PolarisGraphQLContext>, "metrics" | "source" | "document" | "operationName" | "operation">>): Promise<GraphQLResponse | null> | GraphQLResponse | null {
        const request = requestContext.request;
        return new Promise( async () => {
                const result = await runHttpQuery([], {
                    method: request.http?.method!,
                    query: {...request},
                    options: {
                        ...this.optionsToSend,
                        schema: this.graphQLSchema,
                        context: requestContext
                    },
                    request: requestContext.request.http!
                });
                return result;
            }
        );
    }
}
