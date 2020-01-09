import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { makeExecutablePolarisSchema } from '@enigmatis/polaris-schema';
import { ApolloServer } from 'apollo-server-express';
import * as express from 'express';
import { GraphQLSchema } from 'graphql';
import { applyMiddleware } from 'graphql-middleware';
import * as http from 'http';
import * as path from 'path';
import { formatError, PolarisServerOptions } from '..';
import { PolarisServerConfig } from '../config/polaris-server-config';
import { ExtensionsPlugin } from '../extensions/extensions-plugin';
import { ResponseHeadersPlugin } from '../headers/response-headers-plugin';
import { getMiddlewaresMap } from '../middlewares/middlewares-map';
import {
    getDefaultLoggerConfiguration,
    getDefaultMiddlewareConfiguration,
} from './configurations-manager';
import { getPolarisContext } from './context-creator';

const app = express();
let server: http.Server;

export class PolarisServer {
    private static getActualConfiguration(config: PolarisServerOptions): PolarisServerConfig {
        return {
            ...config,
            middlewareConfiguration:
                config.middlewareConfiguration || getDefaultMiddlewareConfiguration(),
            loggerConfiguration: config.loggerConfiguration || getDefaultLoggerConfiguration(),
            applicationProperties: config.applicationProperties || { version: 'v1' },
        };
    }

    private readonly apolloServer: ApolloServer;
    private readonly polarisServerConfig: PolarisServerConfig;
    private readonly polarisGraphQLLogger: PolarisGraphQLLogger;

    constructor(config: PolarisServerOptions) {
        this.polarisServerConfig = PolarisServer.getActualConfiguration(config);

        this.polarisGraphQLLogger = new PolarisGraphQLLogger(
            this.polarisServerConfig.loggerConfiguration,
            this.polarisServerConfig.applicationProperties,
        );

        const serverContext: (context: any) => any = (ctx: any) =>
            this.polarisServerConfig.customContext
                ? this.polarisServerConfig.customContext(ctx)
                : getPolarisContext(ctx);

        this.apolloServer = new ApolloServer(this.getApolloServerConfigurations(serverContext));

        const endpoint = `${this.polarisServerConfig.applicationProperties.version}/graphql`;
        app.use(this.apolloServer.getMiddleware({ path: `/${endpoint}` }));
        app.use(
            '/graphql-playground-react',
            express.static(path.join(__dirname, '../../../static/playground')),
        );
        app.use('/$', (req: express.Request, res: express.Response) => {
            res.redirect(endpoint);
        });
    }

    public async start(): Promise<void> {
        server = await app.listen({ port: this.polarisServerConfig.port });
        this.polarisGraphQLLogger.info(`Server started at port ${this.polarisServerConfig.port}`);
    }

    public async stop(): Promise<void> {
        if (this.apolloServer) {
            await this.apolloServer.stop();
        }
        if (server) {
            await server.close();
        }
        this.polarisGraphQLLogger.info('Server stopped');
    }

    private getApolloServerConfigurations(serverContext: (context: any) => any) {
        return {
            schema: this.getSchemaWithMiddlewares(),
            formatError,
            context: (ctx: any) => serverContext(ctx),
            plugins: [
                new ExtensionsPlugin(this.polarisGraphQLLogger),
                new ResponseHeadersPlugin(this.polarisGraphQLLogger),
            ],
            playground: {
                cdnUrl: '',
                version: '',
            },
        };
    }

    private getSchemaWithMiddlewares(): GraphQLSchema {
        const schema = makeExecutablePolarisSchema(
            this.polarisServerConfig.typeDefs,
            this.polarisServerConfig.resolvers,
        );
        const middlewares = this.getAllowedPolarisMiddlewares();
        if (this.polarisServerConfig.customMiddlewares) {
            middlewares.push(...this.polarisServerConfig.customMiddlewares);
        }
        return applyMiddleware(schema, ...middlewares);
    }

    private getAllowedPolarisMiddlewares(): any[] {
        const allowedMiddlewares: any = [];
        const middlewareConfiguration = this.polarisServerConfig.middlewareConfiguration;
        const middlewaresMap = getMiddlewaresMap(
            this.polarisGraphQLLogger,
            this.polarisServerConfig.connection,
        );
        for (const [key, value] of Object.entries({ ...middlewareConfiguration })) {
            if (value) {
                const middlewares = middlewaresMap.get(key);
                if (middlewares) {
                    middlewares.forEach(x => allowedMiddlewares.push(x));
                }
            }
        }
        return allowedMiddlewares;
    }
}
