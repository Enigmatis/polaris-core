import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import { LoggerConfiguration } from '../../../src/index';

export const loggerConfig: LoggerConfiguration = {
    loggerLevel: 'info',
    writeToConsole: true,
    writeFullMessageToConsole: false,
};

const applicationLogProperties = {
    id: 'example',
    name: 'example',
    component: 'repo',
    environment: 'dev',
    version: '1',
};

export const polarisGraphQLLogger = new PolarisGraphQLLogger(
    {
        loggerLevel: 'info',
        writeToConsole: true,
        writeFullMessageToConsole: false,
    },
    applicationLogProperties,
);
