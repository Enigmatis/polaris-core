import { REALITY_ID } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { AbstractPolarisLogger } from '@enigmatis/polaris-logs';
import { makeExecutablePolarisSchema } from '@enigmatis/polaris-schema';
import {
    getConnectionForReality,
    getPolarisConnectionManager,
    SnapshotPage,
} from '@enigmatis/polaris-typeorm';
import { ApolloServer, ApolloServerExpressConfig } from 'apollo-server-express';
import * as express from 'express';
import { GraphQLSchema } from 'graphql';
import * as http from 'http';
import * as path from 'path';
import {
    createIntrospectionConfig,
    createPlaygroundConfig,
    createPolarisContext,
    createPolarisLoggerFromPolarisServerConfig,
    createPolarisPlugins,
    createPolarisSchemaWithMiddlewares,
    createPolarisSubscriptionsConfig,
    initSnapshotGraphQLOptions,
    polarisFormatError,
    PolarisServerOptions,
} from '..';
import { PolarisServerConfig } from '../config/polaris-server-config';
import {
    clearSnapshotCleanerInterval,
    setSnapshotCleanerInterval,
} from '../snapshot/snapshot-cleaner';
import { getPolarisServerConfigFromOptions } from './configurations-manager';

export const app = express();
let server: http.Server;

export class PolarisServer {
    public readonly apolloServer: ApolloServer;
    public readonly apolloServerConfiguration: ApolloServerExpressConfig;
    private readonly polarisServerConfig: PolarisServerConfig;
    private readonly polarisLogger: AbstractPolarisLogger;

    public constructor(config: PolarisServerOptions) {
        this.polarisServerConfig = getPolarisServerConfigFromOptions(config);
        this.polarisLogger = createPolarisLoggerFromPolarisServerConfig(this.polarisServerConfig);
        this.apolloServerConfiguration = this.getApolloServerConfigurations();
        this.apolloServer = new ApolloServer(this.apolloServerConfiguration);
        initSnapshotGraphQLOptions(
            this.polarisLogger as PolarisGraphQLLogger,
            this.polarisServerConfig,
            this.apolloServer,
            this.createSchemaWithMiddlewares(),
        );
        const endpoint = `${this.polarisServerConfig.applicationProperties.version}/graphql`;
        app.use(this.apolloServer.getMiddleware({ path: `/${endpoint}` }));
        app.use(
            '/graphql-playground-react',
            express.static(path.join(__dirname, '../../../static/playground')),
        );
        app.use('/$', (req: express.Request, res: express.Response) => {
            res.redirect(endpoint);
        });
        app.get('/snapshot', async (req: express.Request, res: express.Response) => {
            const id = req.query.id;
            const realityHeader: string | string[] | undefined = req.headers[REALITY_ID];
            const realityId: number = realityHeader ? +realityHeader : 0;
            const snapshotRepository = getConnectionForReality(
                realityId,
                this.polarisServerConfig.supportedRealities,
                getPolarisConnectionManager(),
            ).getRepository(SnapshotPage);
            const result = await snapshotRepository.findOne({} as any, id);
            res.send(result?.getData());
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
        setSnapshotCleanerInterval(
            this.polarisServerConfig.supportedRealities,
            this.polarisServerConfig.snapshotConfig.secondsToBeOutdated,
            this.polarisServerConfig.snapshotConfig.snapshotCleaningInterval,
            this.polarisLogger,
        );
        this.polarisLogger.info(`Server started at port ${this.polarisServerConfig.port}`);
    }

    public async stop(): Promise<void> {
        clearSnapshotCleanerInterval();
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
        return {
            ...this.polarisServerConfig,
            schema,
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

    private createSchemaWithMiddlewares(): GraphQLSchema {
        const schema: GraphQLSchema = makeExecutablePolarisSchema(
            this.polarisServerConfig.typeDefs,
            this.polarisServerConfig.resolvers,
            this.polarisServerConfig.schemaDirectives,
        );
        return createPolarisSchemaWithMiddlewares(
            schema,
            this.polarisLogger as PolarisGraphQLLogger,
            this.polarisServerConfig,
        );
    }
}
