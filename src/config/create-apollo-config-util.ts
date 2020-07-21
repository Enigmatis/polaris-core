import {
    ApplicationProperties,
    DATA_VERSION,
    INCLUDE_LINKED_OPER,
    OICD_CLAIM_UPN,
    PolarisGraphQLContext,
    Reality,
    REALITY_ID,
    REQUEST_ID,
    REQUESTING_SYS,
    REQUESTING_SYS_NAME,
    SNAP_PAGE_SIZE,
    SNAP_REQUEST,
} from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { AbstractPolarisLogger, LoggerConfiguration } from '@enigmatis/polaris-logs';
import { PolarisLoggerPlugin, TransactionalMutationsPlugin } from '@enigmatis/polaris-middlewares';
import { PolarisConnectionManager } from '@enigmatis/polaris-typeorm';
import { ApolloServer, PlaygroundConfig } from 'apollo-server-express';
import { ApolloServerPlugin } from 'apollo-server-plugin-base';
import { GraphQLSchema } from 'graphql';
import { applyMiddleware } from 'graphql-middleware';
import { merge, remove } from 'lodash';
import { v4 as uuid } from 'uuid';
import { ExpressContext } from '..';
import { getMiddlewaresMap } from '../middlewares/middlewares-map';
import { SnapshotMiddleware } from '../middlewares/snapshot-middleware';
import { ExtensionsPlugin } from '../plugins/extensions/extensions-plugin';
import { ResponseHeadersPlugin } from '../plugins/headers/response-headers-plugin';
import { SnapshotListener } from '../plugins/snapshot/snapshot-listener';
import { SnapshotPlugin } from '../plugins/snapshot/snapshot-plugin';
import { PolarisServerConfig } from './polaris-server-config';

export function createPolarisLoggerFromPolarisServerOptions(
    loggerDef: LoggerConfiguration | PolarisGraphQLLogger,
    applicationProperties: ApplicationProperties,
): PolarisGraphQLLogger {
    return loggerDef instanceof PolarisGraphQLLogger
        ? loggerDef
        : new PolarisGraphQLLogger(loggerDef as LoggerConfiguration, applicationProperties);
}

export function createPolarisPlugins(
    polarisLogger: PolarisGraphQLLogger,
    config: PolarisServerConfig,
    connectionManager?: PolarisConnectionManager,
): any[] {
    const plugins: any[] = [
        new ExtensionsPlugin(polarisLogger, config.shouldAddWarningsToExtensions),
        new ResponseHeadersPlugin(polarisLogger),
        new PolarisLoggerPlugin(polarisLogger),
    ];
    if (connectionManager) {
        plugins.push(
            new SnapshotPlugin(
                polarisLogger,
                config.supportedRealities,
                config.snapshotConfig,
                connectionManager,
            ),
        );
        if (config.middlewareConfiguration.allowTransactionalMutations) {
            plugins.push(
                new TransactionalMutationsPlugin(
                    polarisLogger,
                    config.supportedRealities,
                    connectionManager,
                ),
            );
        }
    }
    if (config.plugins) {
        plugins.push(...config.plugins);
    }
    return plugins;
}

export function initSnapshotGraphQLOptions(
    polarisLogger: PolarisGraphQLLogger,
    config: PolarisServerConfig,
    server: ApolloServer,
    schema: GraphQLSchema,
    connectionManager: PolarisConnectionManager,
): void {
    const plugins: any[] = createPolarisPlugins(polarisLogger, config, connectionManager);
    remove(plugins, (plugin: ApolloServerPlugin) => plugin instanceof SnapshotPlugin);
    SnapshotListener.graphQLOptions = {
        ...server.requestOptions,
        plugins,
        schema,
    };
}

export function createPolarisMiddlewares(
    config: PolarisServerConfig,
    logger: PolarisGraphQLLogger,
    connectionManager?: PolarisConnectionManager,
): any[] {
    const allowedMiddlewares: any = [];
    const middlewareConfiguration = config.middlewareConfiguration;
    if (config.supportedRealities) {
        const middlewaresMap = getMiddlewaresMap(
            logger,
            config.supportedRealities,
            connectionManager,
        );
        for (const [key, value] of Object.entries({ ...middlewareConfiguration })) {
            if (value) {
                const middlewares = middlewaresMap.get(key);
                if (middlewares) {
                    middlewares.forEach(x => allowedMiddlewares.push(x));
                }
            }
        }
        if (config.customMiddlewares) {
            return [...allowedMiddlewares, ...config.customMiddlewares];
        }
    }
    return allowedMiddlewares;
}

export function createPolarisSchemaWithMiddlewares(
    schema: GraphQLSchema,
    logger: PolarisGraphQLLogger,
    config: PolarisServerConfig,
    connectionManager?: PolarisConnectionManager,
) {
    applyMiddleware(schema, new SnapshotMiddleware(logger, config.snapshotConfig).getMiddleware());
    return applyMiddleware(schema, ...createPolarisMiddlewares(config, logger, connectionManager));
}

export function createPolarisSubscriptionsConfig(config: PolarisServerConfig): any {
    return {
        path: `/${config.applicationProperties.version}/subscription`,
    };
}

export function createPolarisContext(logger: AbstractPolarisLogger, config: PolarisServerConfig) {
    return (context: ExpressContext): PolarisGraphQLContext => {
        const { req, connection } = context;
        const headers = req ? req.headers : connection?.context;
        const body = req ? req.body : connection;

        if (
            config.allowMandatoryHeaders &&
            (headers[REALITY_ID] === undefined || headers[REQUESTING_SYS] === undefined)
        ) {
            const error = new Error('Mandatory headers were not set!');
            logger.error(error.message);
            throw error;
        }

        const requestId = headers[REQUEST_ID] || uuid();
        const upn = headers[OICD_CLAIM_UPN];
        const realityId = +headers[REALITY_ID] || 0;
        const snapRequest = headers[SNAP_REQUEST] === 'true';
        const snapPageSize = +headers[SNAP_PAGE_SIZE];
        const reality: Reality | undefined = config.supportedRealities?.getReality(realityId);
        if (!reality) {
            const error = new Error('Requested reality is not supported!');
            logger.error(error.message);
            throw error;
        }

        const baseContext = {
            reality,
            requestHeaders: {
                upn,
                requestId,
                realityId,
                snapRequest,
                snapPageSize,
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
            clientIp: req?.ip,
            request: {
                query: body.query,
                operationName: body.operationName,
                variables: body.variables,
            },
            returnedExtensions: {} as any,
        };

        if (config.customContext) {
            const customContext = config.customContext(context);
            return merge(customContext, baseContext);
        } else {
            return baseContext;
        }
    };
}

export function createPlaygroundConfig(config: PolarisServerConfig): PlaygroundConfig {
    return isProduction(config)
        ? false
        : { cdnUrl: '', version: config.applicationProperties.version };
}

export function createIntrospectionConfig(config: PolarisServerConfig): boolean {
    return !isProduction(config);
}

export function isProduction(config: PolarisServerConfig): boolean {
    const environment: string | undefined = config.applicationProperties.environment;
    return environment === 'prod' || environment === 'production';
}
