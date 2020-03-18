import { LoggerConfiguration } from '@enigmatis/polaris-logs';
import { MiddlewareConfiguration, PolarisServerOptions } from '..';
import { PolarisServerConfig } from '../config/polaris-server-config';

export const getDefaultMiddlewareConfiguration = (): MiddlewareConfiguration => {
    return {
        allowDataVersionAndIrrelevantEntitiesMiddleware: true,
        allowRealityMiddleware: true,
        allowSoftDeleteMiddleware: true,
    };
};

export const getDefaultLoggerConfiguration = (): LoggerConfiguration => {
    return {
        loggerLevel: 'info',
        writeToConsole: true,
        writeFullMessageToConsole: false,
    };
};

export const getPolarisServerConfigFromOptions = (
    options: PolarisServerOptions,
): PolarisServerConfig => {
    return {
        ...options,
        middlewareConfiguration:
            options.middlewareConfiguration || getDefaultMiddlewareConfiguration(),
        logger: options.logger || getDefaultLoggerConfiguration(),
        applicationProperties: options.applicationProperties || { version: 'v1' },
        allowSubscription: options.allowSubscription || false,
        allowMandatoryHeaders: options.allowMandatoryHeaders || false,
    };
};
