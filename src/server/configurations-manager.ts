import { LoggerConfiguration } from '@enigmatis/polaris-logs';
import { MiddlewareConfiguration } from '..';

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
