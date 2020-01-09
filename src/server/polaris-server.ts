import {
    DATA_VERSION,
    INCLUDE_LINKED_OPER,
    OICD_CLAIM_UPN,
    PolarisGraphQLContext,
    REALITY_ID,
    REQUEST_ID,
    REQUESTING_SYS,
    REQUESTING_SYS_NAME,
} from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { LoggerConfiguration } from '@enigmatis/polaris-logs';
import { makeExecutablePolarisSchema } from '@enigmatis/polaris-schema';
import { ApolloServer } from 'apollo-server-express';
import * as express from 'express';
import { GraphQLSchema } from 'graphql';
import { applyMiddleware } from 'graphql-middleware';
import * as http from 'http';
import { address as getIpAddress } from 'ip';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { formatError, MiddlewareConfiguration, PolarisServerConfig } from '..';
import { ExtensionsPlugin } from '../extensions/extensions-plugin';
import { ResponseHeadersPlugin } from '../headers/response-headers-plugin';
import { getMiddlewaresMap } from '../middlewares/middlewares-map';

const app = express();
let server: http.Server;

export class PolarisServer {
    public static getDefaultMiddlewareConfiguration(): MiddlewareConfiguration {
        return {
            allowDataVersionAndIrrelevantEntitiesMiddleware: true,
            allowRealityMiddleware: true,
            allowSoftDeleteMiddleware: true,
        };
    }

    public static getDefaultLoggerConfiguration(): LoggerConfiguration {
        return {
            loggerLevel: 'info',
            writeToConsole: true,
            writeFullMessageToConsole: false,
        };
    }

    public static getPolarisContext(context: any): PolarisGraphQLContext {
        const httpHeaders = context.req.headers;
        const requestId = httpHeaders[REQUEST_ID] ? httpHeaders[REQUEST_ID] : uuid();
        const upn = httpHeaders[OICD_CLAIM_UPN];
        const realityId = +httpHeaders[REALITY_ID];
        return {
            requestHeaders: {
                upn,
                requestId,
                realityId,
                dataVersion: +httpHeaders[DATA_VERSION],
                includeLinkedOper: httpHeaders[INCLUDE_LINKED_OPER] === 'true',
                requestingSystemId: httpHeaders[REQUESTING_SYS],
                requestingSystemName: httpHeaders[REQUESTING_SYS_NAME],
            },
            responseHeaders: {
                upn,
                requestId,
                realityId,
            },
            clientIp: getIpAddress(),
            request: {
                query: context.req.body.query,
                operationName: context.req.body.operationName,
                polarisVariables: context.req.body.variables,
            },
            response: context.res,
            returnedExtensions: {} as any,
        };
    }

    private readonly apolloServer: ApolloServer;
    private readonly polarisServerConfig: PolarisServerConfig;
    private readonly polarisGraphQLLogger: PolarisGraphQLLogger;

    constructor(config: PolarisServerConfig) {
        this.polarisServerConfig = config;
        if (!this.polarisServerConfig.middlewareConfiguration) {
            this.polarisServerConfig.middlewareConfiguration = PolarisServer.getDefaultMiddlewareConfiguration();
        }
        if (!this.polarisServerConfig.loggerConfiguration) {
            this.polarisServerConfig.loggerConfiguration = PolarisServer.getDefaultLoggerConfiguration();
        }

        if (!this.polarisServerConfig.applicationProperties) {
            this.polarisServerConfig.applicationProperties = { version: 'v1' };
        }

        this.polarisGraphQLLogger = new PolarisGraphQLLogger(
            this.polarisServerConfig.loggerConfiguration,
            this.polarisServerConfig.applicationProperties,
        );

        const serverContext: (context: any) => any = (ctx: any) =>
            this.polarisServerConfig.customContext
                ? this.polarisServerConfig.customContext(ctx)
                : PolarisServer.getPolarisContext(ctx);

        this.apolloServer = new ApolloServer({
            schema: this.getSchemaWithMiddlewares(),
            formatError,
            context: ctx => serverContext(ctx),
            plugins: [
                new ExtensionsPlugin(this.polarisGraphQLLogger),
                new ResponseHeadersPlugin(this.polarisGraphQLLogger),
            ],
            playground: {
                cdnUrl: '',
                version: '',
            },
        });

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
