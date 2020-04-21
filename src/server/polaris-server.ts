import { RealitiesHolder } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { AbstractPolarisLogger } from '@enigmatis/polaris-logs';
import { makeExecutablePolarisSchema } from '@enigmatis/polaris-schema';
import { ApolloServer, ApolloServerExpressConfig } from 'apollo-server-express';
import * as express from 'express';
import { GraphQLSchema } from 'graphql';
import { applyMiddleware } from 'graphql-middleware';
import * as http from 'http';
import * as path from 'path';
import { polarisFormatError, PolarisServerOptions } from '..';
import {
    createIntrospectionConfig,
    createPlaygroundConfig,
    createPolarisContext,
    createPolarisLoggerFromPolarisServerConfig,
    createPolarisMiddlewares,
    createPolarisPlugins,
    createPolarisSubscriptionsConfig,
} from '../config/create-apollo-config-util';
import { PolarisServerConfig } from '../config/polaris-server-config';
import { getPolarisServerConfigFromOptions } from './configurations-manager';

export const app = express();
let server: http.Server;

export class PolarisServer {
    private readonly apolloServer: ApolloServer;
    private readonly polarisServerConfig: PolarisServerConfig;
    private readonly polarisLogger: AbstractPolarisLogger;

    constructor(config: PolarisServerOptions) {
        this.polarisServerConfig = getPolarisServerConfigFromOptions(config);
        this.polarisLogger = createPolarisLoggerFromPolarisServerConfig(this.polarisServerConfig);
        this.apolloServer = new ApolloServer(this.getApolloServerConfigurations());

        const endpoint = `${this.polarisServerConfig.applicationProperties.version}/graphql`;
        app.use(this.apolloServer.getMiddleware({ path: `/${endpoint}` }));
        app.use(
            '/graphql-playground-react',
            express.static(path.join(__dirname, '../../../static/playground')),
        );
        app.use('/$', (req: express.Request, res: express.Response) => {
            res.redirect(endpoint);
        });
        app.get('/whoami', (req: express.Request, res: express.Response) => {
            const appProps = this.polarisServerConfig.applicationProperties;
            const whoami = { service: appProps.name, version: appProps.version };
            res.send(whoami);
        });
    }

    public async start(): Promise<void> {
        server = http.createServer(app);
        if (this.polarisServerConfig.allowSubscription) {
            this.apolloServer.installSubscriptionHandlers(server);
        }
        await server.listen({ port: this.polarisServerConfig.port });
        this.polarisLogger.info(`Server started at port ${this.polarisServerConfig.port}`);
    }

    public async stop(): Promise<void> {
        if (this.apolloServer) {
            await this.apolloServer.stop();
        }
        if (server) {
            await server.close();
        }
        this.polarisLogger.info('Server stopped');
    }

    private getApolloServerConfigurations(): ApolloServerExpressConfig {
        return {
            ...this.polarisServerConfig,
            schema: this.createSchemaWithMiddlewares(this.polarisServerConfig.supportedRealities),
            context: createPolarisContext(this.polarisLogger, this.polarisServerConfig),
            plugins: createPolarisPlugins(
                this.polarisLogger as PolarisGraphQLLogger,
                this.polarisServerConfig,
            ),
            playground: createPlaygroundConfig(this.polarisServerConfig),
            introspection: createIntrospectionConfig(this.polarisServerConfig),
            formatError: polarisFormatError,
            subscriptions: createPolarisSubscriptionsConfig(this.polarisServerConfig),
        };
    }

    private createSchemaWithMiddlewares(supportedRealities: RealitiesHolder): GraphQLSchema {
        const schema = makeExecutablePolarisSchema(
            this.polarisServerConfig.typeDefs,
            this.polarisServerConfig.resolvers,
            this.polarisServerConfig.schemaDirectives,
        );
        return applyMiddleware(
            schema,
            ...createPolarisMiddlewares(
                this.polarisServerConfig,
                this.polarisLogger as PolarisGraphQLLogger,
            ),
        );
    }
}
