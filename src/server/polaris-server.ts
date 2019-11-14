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
import {
    dataVersionMiddleware,
    realitiesMiddleware,
    softDeletedMiddleware,
} from '@enigmatis/polaris-middlewares';
import { makeExecutablePolarisSchema } from '@enigmatis/polaris-schema';
import { ApolloServer } from 'apollo-server-express';
import * as express from 'express';
import { applyMiddleware } from 'graphql-middleware';
import { address } from 'ip';
import { v4 } from 'uuid';
import { formatError, PolarisServerConfig } from '..';
import { MiddlewareConfiguration } from '../config/middleware-configuration';
import { middlewaresMap } from '../middlewares/middlewares-map';

const app = express();

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

    private static getPolarisContext(context: any): PolarisGraphQLContext {
        const requestId = context.req.headers[REQUEST_ID] ? context.req.headers[REQUEST_ID] : v4();
        return {
            requestHeaders: {
                dataVersion: +context.req.headers[DATA_VERSION],
                requestId,
                realityId: +context.req.headers[REALITY_ID],
                includeLinkedOper: context.req.headers[INCLUDE_LINKED_OPER] === 'true',
                requestingSystemId: context.req.headers[REQUESTING_SYS],
                requestingSystemName: context.req.headers[REQUESTING_SYS_NAME],
                upn: context.req.headers[OICD_CLAIM_UPN],
            },
            responseHeaders: {
                requestId,
            },
            clientIp: address(),
            request: {
                query: context.req.body.query,
                operationName: context.req.body.operationName,
                polarisVariables: context.req.body.variables,
            },
            response: context.res,
            returnedExtensions: {
                globalDataVersion: 0,
            },
        };
    }

    private readonly polarisServerConfig?: PolarisServerConfig;
    private apolloServer: ApolloServer;
    private polarisGraphQLLogger: PolarisGraphQLLogger;

    constructor(config: PolarisServerConfig) {
        this.polarisServerConfig = config;
        if (!this.polarisServerConfig.middlewareConfiguration) {
            this.polarisServerConfig.middlewareConfiguration = PolarisServer.getDefaultMiddlewareConfiguration();
        }
        if (!this.polarisServerConfig.loggerConfiguration) {
            this.polarisServerConfig.loggerConfiguration = PolarisServer.getDefaultLoggerConfiguration();
        }
        this.polarisGraphQLLogger = new PolarisGraphQLLogger(
            this.polarisServerConfig.applicationLogProperties,
            this.polarisServerConfig.loggerConfiguration,
        );
        this.apolloServer = new ApolloServer({
            schema: this.getSchemaWithMiddlewares(),
            formatError,
            context: ctx => PolarisServer.getPolarisContext(ctx),
        });
        this.apolloServer.applyMiddleware({ app });
        app.use(this.apolloServer.getMiddleware());
    }

    public async start() {
        if (this.polarisServerConfig) {
            await app.listen({ port: this.polarisServerConfig.port });
            this.polarisGraphQLLogger.info(
                `Server started at http://localhost:${this.polarisServerConfig.port}${this.apolloServer.graphqlPath}`,
            );
        }
    }

    public async stop() {
        await this.apolloServer.stop();
        this.polarisGraphQLLogger.info('Server stopped');
    }

    private getSchemaWithMiddlewares() {
        if (this.polarisServerConfig) {
            const schema = makeExecutablePolarisSchema(
                this.polarisServerConfig.typeDefs,
                this.polarisServerConfig.resolvers,
            );

            const allowedMiddlewares: any = [];
            const middlewareConfiguration = this.polarisServerConfig.middlewareConfiguration;
            for (const [key, value] of Object.entries({ ...middlewareConfiguration })) {
                if (value) {
                    const middlewares = middlewaresMap.get(key);
                    if (middlewares) {
                        middlewares.forEach(x => allowedMiddlewares.push(x));
                    }
                }
            }
            return applyMiddleware(schema, ...allowedMiddlewares);
        }
    }
}
