import { ApplicationProperties, RealitiesHolder } from '@enigmatis/polaris-common';
import { LoggerConfiguration } from '@enigmatis/polaris-logs';
import {
    createPolarisLoggerFromPolarisServerOptions,
    MiddlewareConfiguration,
    PolarisServerConfig,
    PolarisServerOptions,
    SnapshotConfiguration,
} from '..';

const getDefaultMiddlewareConfiguration = (): MiddlewareConfiguration => ({
    allowDataVersionAndIrrelevantEntitiesMiddleware: true,
    allowRealityMiddleware: true,
    allowSoftDeleteMiddleware: true,
    allowTransactionalMutations: true,
});

const getDefaultLoggerConfiguration = (): LoggerConfiguration => ({
    loggerLevel: 'info',
    writeToConsole: true,
    writeFullMessageToConsole: false,
});

const getDefaultSnapshotConfiguration = (): SnapshotConfiguration => ({
    snapshotCleaningInterval: 60,
    secondsToBeOutdated: 60,
    maxPageSize: 50,
    entitiesAmountPerFetch: 50,
    autoSnapshot: false,
});

const getSupportedRealities = (options: PolarisServerOptions): RealitiesHolder => {
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
};

const getDefaultApplicationProperties = (
    properties?: ApplicationProperties,
): ApplicationProperties => {
    const defaultVersion = { version: 'v1' };
    if (!properties) {
        return defaultVersion;
    } else if (!properties.version) {
        return { ...properties, ...defaultVersion };
    } else {
        return properties;
    }
};

export const getPolarisServerConfigFromOptions = (
    options: PolarisServerOptions,
): PolarisServerConfig => {
    const applicationProperties = getDefaultApplicationProperties(options.applicationProperties);
    return {
        ...options,
        middlewareConfiguration:
            options.middlewareConfiguration || getDefaultMiddlewareConfiguration(),
        logger: createPolarisLoggerFromPolarisServerOptions(
            options.logger || getDefaultLoggerConfiguration(),
            applicationProperties,
        ),
        applicationProperties,
        allowSubscription: options.allowSubscription || false,
        shouldAddWarningsToExtensions:
            options.shouldAddWarningsToExtensions === undefined
                ? true
                : options.shouldAddWarningsToExtensions,
        allowMandatoryHeaders: options.allowMandatoryHeaders || false,
        supportedRealities: getSupportedRealities(options),
        snapshotConfig: options.snapshotConfig || getDefaultSnapshotConfiguration(),
    };
};
