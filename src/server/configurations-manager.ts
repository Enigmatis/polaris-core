import { RealitiesHolder } from '@enigmatis/polaris-common';
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

export function getSupportedRealities(options: PolarisServerOptions): RealitiesHolder {
    if (!options.supportedRealities) {
        options.supportedRealities = new RealitiesHolder();
    }

    if (!options.supportedRealities.hasReality(0)) {
        options.supportedRealities.addReality({
            id: 0,
            type: 'real',
            name: 'default',
        });
    }

    return options.supportedRealities;
}

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
        shouldAddWarningsToExtensions:
            options.shouldAddWarningsToExtensions === undefined
                ? true
                : options.shouldAddWarningsToExtensions,
        allowMandatoryHeaders: options.allowMandatoryHeaders || false,
        supportedRealities: getSupportedRealities(options),
    };
};
