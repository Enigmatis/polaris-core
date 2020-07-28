import { AbstractPolarisLogger } from '@enigmatis/polaris-logs';
import { makeExecutablePolarisSchema } from '@enigmatis/polaris-schema';
import { ApolloServer, ApolloServerExpressConfig } from 'apollo-server-express';
import * as express from 'express';
import { GraphQLSchema } from 'graphql';
import * as http from 'http';
import * as path from 'path';
import {
    createIntrospectionConfig,
    createPlaygroundConfig,
    createPolarisContext,
    createPolarisPlugins,
    createPolarisSchemaWithMiddlewares,
    createPolarisSubscriptionsConfig,
    initSnapshotGraphQLOptions,
    polarisFormatError,
    PolarisServerConfig,
    PolarisServerOptions,
} from '..';
import {
    clearSnapshotCleanerInterval,
    setSnapshotCleanerInterval,
} from '../snapshot/snapshot-cleaner';
import { getPolarisServerConfigFromOptions } from './configurations-manager';
import { createSnapshotRoutes } from './routes/snapshot-routes';

export const app = express();
let server: http.Server;

export class PolarisServer {
    public readonly apolloServer: ApolloServer;
    public readonly apolloServerConfiguration: ApolloServerExpressConfig;
    private readonly polarisServerConfig: PolarisServerConfig;
    private readonly polarisLogger: AbstractPolarisLogger;

    public constructor(config: PolarisServerOptions) {
        this.polarisServerConfig = getPolarisServerConfigFromOptions(config);
        this.polarisLogger = this.polarisServerConfig.logger;
        this.apolloServerConfiguration = this.getApolloServerConfigurations();
        this.apolloServer = new ApolloServer(this.apolloServerConfiguration);

        if (config.connectionManager) {
            initSnapshotGraphQLOptions(
                this.polarisServerConfig.logger,
                this.polarisServerConfig,
                this.apolloServer,
                this.createSchemaWithMiddlewares(),
                config.connectionManager,
            );
            app.use('/snapshot', createSnapshotRoutes(this.polarisServerConfig, config));
        }
        const { version } = this.polarisServerConfig.applicationProperties;
        const endpoint = `${version}/graphql`;
        app.use(this.apolloServer.getMiddleware({ path: `/${endpoint}` }));
        app.use(
            `/@apollographql/graphql-playground-react@${version}`,
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
        if (this.polarisServerConfig.connectionManager) {
            setSnapshotCleanerInterval(
                this.polarisServerConfig.supportedRealities,
                this.polarisServerConfig.snapshotConfig.secondsToBeOutdated,
                this.polarisServerConfig.snapshotConfig.snapshotCleaningInterval,
                this.polarisLogger,
                this.polarisServerConfig.connectionManager,
            );
        }
        this.polarisLogger.info(`Server started at port ${this.polarisServerConfig.port}`);
    }

    public async stop(): Promise<void> {
        await clearSnapshotCleanerInterval();
        if (this.apolloServer) {
            await this.apolloServer.stop();
        }
        if (server) {
            await server.close();
        }
        this.polarisLogger.info('Server stopped');
    }

    private getApolloServerConfigurations(): ApolloServerExpressConfig {
        const schema: GraphQLSchema = this.createSchemaWithMiddlewares();
        const config: Omit<PolarisServerConfig, 'logger'> = this.polarisServerConfig;
        return {
            ...config,
            schema,
            context: createPolarisContext(this.polarisLogger, this.polarisServerConfig),
            plugins: createPolarisPlugins(
                this.polarisServerConfig.logger,
                this.polarisServerConfig,
                this.polarisServerConfig.connectionManager,
            ),
            playground: createPlaygroundConfig(this.polarisServerConfig),
            introspection: createIntrospectionConfig(this.polarisServerConfig),
            formatError: polarisFormatError,
            subscriptions: createPolarisSubscriptionsConfig(this.polarisServerConfig),
        };
    }

    private createSchemaWithMiddlewares(): GraphQLSchema {
        const schema: GraphQLSchema = makeExecutablePolarisSchema(
            this.polarisServerConfig.typeDefs,
            this.polarisServerConfig.resolvers,
            this.polarisServerConfig.schemaDirectives,
        );
        return createPolarisSchemaWithMiddlewares(
            schema,
            this.polarisServerConfig.logger,
            this.polarisServerConfig,
            this.polarisServerConfig.connectionManager,
        );
    }
}
