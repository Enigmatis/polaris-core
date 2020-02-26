import {
    DATA_VERSION,
    INCLUDE_LINKED_OPER,
    OICD_CLAIM_UPN,
    PolarisGraphQLContext,
    RealitiesHolder,
    Reality,
    REALITY_ID,
    REQUEST_ID,
    REQUESTING_SYS,
    REQUESTING_SYS_NAME,
} from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { AbstractPolarisLogger, LoggerConfiguration } from '@enigmatis/polaris-logs';
import { PolarisLoggerPlugin } from '@enigmatis/polaris-middlewares';
import { makeExecutablePolarisSchema } from '@enigmatis/polaris-schema';
import { ApolloServer, ApolloServerExpressConfig } from 'apollo-server-express';
import { ApolloServerPlugin } from 'apollo-server-plugin-base';
import * as deepMerge from 'deepmerge';
import * as express from 'express';
import { GraphQLSchema } from 'graphql';
import { applyMiddleware } from 'graphql-middleware';
import * as http from 'http';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { formatError, PolarisServerOptions } from '..';
import { PolarisServerConfig } from '../config/polaris-server-config';
import { ExtensionsPlugin } from '../extensions/extensions-plugin';
import { ResponseHeadersPlugin } from '../headers/response-headers-plugin';
import { getMiddlewaresMap } from '../middlewares/middlewares-map';
import {
    getDefaultLoggerConfiguration,
    getDefaultMiddlewareConfiguration,
} from './configurations-manager';
import { ExpressContext } from './express-context';

const app = express();
let server: http.Server;

export class PolarisServer {
    private static getActualConfiguration(config: PolarisServerOptions): PolarisServerConfig {
        return {
            ...config,
            middlewareConfiguration:
                config.middlewareConfiguration || getDefaultMiddlewareConfiguration(),
            logger: config.logger || getDefaultLoggerConfiguration(),
            applicationProperties: config.applicationProperties || { version: 'v1' },
            allowSubscription: config.allowSubscription || false,
        };
    }

    private readonly apolloServer: ApolloServer;
    private readonly polarisServerConfig: PolarisServerConfig;
    private readonly polarisLogger: AbstractPolarisLogger;

    constructor(config: PolarisServerOptions) {
        this.polarisServerConfig = PolarisServer.getActualConfiguration(config);

        if (this.polarisServerConfig.logger instanceof PolarisGraphQLLogger) {
            this.polarisLogger = this.polarisServerConfig.logger;
        } else {
            this.polarisLogger = new PolarisGraphQLLogger(
                this.polarisServerConfig.logger as LoggerConfiguration,
                this.polarisServerConfig.applicationProperties,
            );
        }

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
        const plugins: Array<ApolloServerPlugin | (() => ApolloServerPlugin)> = [
            new ExtensionsPlugin(this.polarisLogger as PolarisGraphQLLogger),
            new ResponseHeadersPlugin(this.polarisLogger as PolarisGraphQLLogger),
            new PolarisLoggerPlugin(this.polarisLogger as PolarisGraphQLLogger),
        ];
        if (this.polarisServerConfig.plugins) {
            plugins.push(...this.polarisServerConfig.plugins);
        }

        return {
            ...this.polarisServerConfig,
            schema: this.getSchemaWithMiddlewares(),
            context: (ctx: ExpressContext) => this.getPolarisContext(ctx),
            plugins,
            playground: {
                cdnUrl: '',
                version: '',
            },
            formatError,
            subscriptions: {
                path: `/${this.polarisServerConfig.applicationProperties.version}/subscription`,
            },
        };
    }

    private getSupportedRealities() {
        if (!this.polarisServerConfig.supportedRealities) {
            this.polarisServerConfig.supportedRealities = new RealitiesHolder();
        }

        if (!this.polarisServerConfig.supportedRealities.hasReality(0)) {
            this.polarisServerConfig.supportedRealities.addReality({
                id: 0,
                type: 'real',
                name: 'default',
            });
        }

        return this.polarisServerConfig.supportedRealities;
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
            this.polarisLogger as PolarisGraphQLLogger,
            this.getSupportedRealities(),
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

    private getPolarisContext = (context: ExpressContext): PolarisGraphQLContext => {
        const { req, connection } = context;
        const headers = req ? req.headers : connection?.context;
        const body = req ? req.body : connection;

        const requestId = headers[REQUEST_ID] || uuid();
        const upn = headers[OICD_CLAIM_UPN];
        const realityId = +headers[REALITY_ID] || 0;

        const supportedRealities = this.getSupportedRealities();
        const reality: Reality | undefined = supportedRealities.getReality(realityId);
        if (!reality) {
            throw new Error('Requested reality is not supported!');
        }

        const baseContext = {
            reality,
            requestHeaders: {
                upn,
                requestId,
                realityId,
                dataVersion: +headers[DATA_VERSION],
                includeLinkedOper: headers[INCLUDE_LINKED_OPER] === 'true',
                requestingSystemId: headers[REQUESTING_SYS],
                requestingSystemName: headers[REQUESTING_SYS_NAME],
            },
            responseHeaders: {
                upn,
                requestId,
                realityId,
            },
            clientIp: req.ip,
            request: {
                query: body.query,
                operationName: body.operationName,
                variables: body.variables,
            },
            returnedExtensions: {} as any,
        };

        if (this.polarisServerConfig.customContext) {
            const customContext = this.polarisServerConfig.customContext(context);
            return deepMerge(customContext, baseContext);
        } else {
            return baseContext;
        }
    };
}
