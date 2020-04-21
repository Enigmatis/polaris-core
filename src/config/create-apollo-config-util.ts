import {
    DATA_VERSION,
    INCLUDE_LINKED_OPER,
    OICD_CLAIM_UPN,
    PolarisGraphQLContext,
    Reality,
    REALITY_ID,
    REQUEST_ID,
    REQUESTING_SYS,
    REQUESTING_SYS_NAME,
} from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { AbstractPolarisLogger, LoggerConfiguration } from '@enigmatis/polaris-logs';
import { PolarisLoggerPlugin } from '@enigmatis/polaris-middlewares';
import { SubscriptionServerOptions } from 'apollo-server-core/src/types';
import { PlaygroundConfig } from 'apollo-server-express';
import { ApolloServerPlugin } from 'apollo-server-plugin-base';
import { merge } from 'lodash';
import { v4 as uuid } from 'uuid';
import { ExpressContext } from '..';
import { ResponseHeadersPlugin } from '../headers/response-headers-plugin';
import { getMiddlewaresMap } from '../middlewares/middlewares-map';
import { ExtensionsPlugin } from '../plugins/extensions/extensions-plugin';
import { PolarisServerConfig } from './polaris-server-config';

export function createPolarisLoggerFromPolarisServerConfig(
    config: PolarisServerConfig,
): AbstractPolarisLogger {
    return config.logger instanceof PolarisGraphQLLogger
        ? config.logger
        : new PolarisGraphQLLogger(
              config.logger as LoggerConfiguration,
              config.applicationProperties,
          );
}

export function createPolarisPlugins(
    polarisLogger: PolarisGraphQLLogger,
    polarisServerConfig: PolarisServerConfig,
): Array<ApolloServerPlugin | (() => ApolloServerPlugin)> {
    const plugins: Array<ApolloServerPlugin | (() => ApolloServerPlugin)> = [
        new ExtensionsPlugin(polarisLogger, polarisServerConfig.shouldAddWarningsToExtensions),
        new ResponseHeadersPlugin(polarisLogger),
        new PolarisLoggerPlugin(polarisLogger),
    ];
    if (polarisServerConfig.plugins) {
        plugins.push(...polarisServerConfig.plugins);
    }
    return plugins;
}

export function createPolarisMiddlewares(
    config: PolarisServerConfig,
    logger: PolarisGraphQLLogger,
): any[] {
    const allowedMiddlewares: any = [];
    const middlewareConfiguration = config.middlewareConfiguration;
    const middlewaresMap = getMiddlewaresMap(logger, config.supportedRealities, config.connection);
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
    return allowedMiddlewares;
}
export function createPolarisSubscriptionsConfig(
    config: PolarisServerConfig,
): Partial<SubscriptionServerOptions> | string | false {
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
        const reality: Reality | undefined = config.supportedRealities.getReality(realityId);
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
    return isProduction(config) ? false : { cdnUrl: '', version: '' };
}

export function createIntrospectionConfig(config: PolarisServerConfig): boolean | undefined {
    return isProduction(config) ? false : true;
}

export function isProduction(config: PolarisServerConfig): boolean {
    const environment: string | undefined = config.applicationProperties.environment;
    return environment === 'prod' || environment === 'production';
}
