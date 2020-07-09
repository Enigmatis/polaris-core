import { ApplicationProperties, RealitiesHolder } from '@enigmatis/polaris-common';
import { LoggerConfiguration } from '@enigmatis/polaris-logs';
import {
    createPolarisLoggerFromPolarisServerOptions,
    getPolarisServerConfigFromOptions,
    MiddlewareConfiguration,
    PolarisServerConfig,
    PolarisServerOptions,
    SnapshotConfiguration,
} from '../../../src';

jest.mock('../../../src/config/create-apollo-config-util', () => ({
    createPolarisLoggerFromPolarisServerOptions: jest.fn(),
}));

describe('getPolarisServerConfigFromOptions tests', () => {
    describe('application properties', () => {
        test('providing options without application properties, returning default application properties', () => {
            const polarisServerOptions: PolarisServerOptions = {
                typeDefs: {} as any,
                resolvers: {} as any,
                port: 8080,
            };
            const polarisServerConfig: PolarisServerConfig = getPolarisServerConfigFromOptions(
                polarisServerOptions,
            );
            expect(polarisServerConfig.applicationProperties).toEqual({ version: 'v1' });
        });

        test('providing options with partial application properties, returning default version', () => {
            const applicationProperties: ApplicationProperties = {
                id: 'foo',
                name: 'bar',
            };
            const polarisServerOptions: PolarisServerOptions = {
                typeDefs: {} as any,
                resolvers: {} as any,
                port: 8080,
                applicationProperties,
            };
            const polarisServerConfig: PolarisServerConfig = getPolarisServerConfigFromOptions(
                polarisServerOptions,
            );
            expect(polarisServerConfig.applicationProperties).toEqual({
                ...applicationProperties,
                version: 'v1',
            });
        });

        test('providing options with full application properties, returning provided application properties', () => {
            const applicationProperties: ApplicationProperties = {
                id: 'foo',
                name: 'bar',
                version: 'v1',
                component: 'comp',
                environment: 'test',
            };
            const polarisServerOptions: PolarisServerOptions = {
                typeDefs: {} as any,
                resolvers: {} as any,
                port: 8080,
                applicationProperties,
            };
            const polarisServerConfig: PolarisServerConfig = getPolarisServerConfigFromOptions(
                polarisServerOptions,
            );
            expect(polarisServerConfig.applicationProperties).toBe(applicationProperties);
        });
    });

    describe('middleware configuration', () => {
        test('providing options without middleware configuration, returning default middleware configuration', () => {
            const polarisServerOptions: PolarisServerOptions = {
                typeDefs: {} as any,
                resolvers: {} as any,
                port: 8080,
            };
            const polarisServerConfig: PolarisServerConfig = getPolarisServerConfigFromOptions(
                polarisServerOptions,
            );
            expect(polarisServerConfig.middlewareConfiguration).toEqual({
                allowDataVersionAndIrrelevantEntitiesMiddleware: true,
                allowRealityMiddleware: true,
                allowSoftDeleteMiddleware: true,
                allowTransactionalMutations: true,
            });
        });

        test('providing options with middleware configuration, returning provided middleware configuration', () => {
            const middlewareConfiguration: MiddlewareConfiguration = {
                allowDataVersionAndIrrelevantEntitiesMiddleware: true,
                allowRealityMiddleware: false,
                allowSoftDeleteMiddleware: true,
                allowTransactionalMutations: false,
            };
            const polarisServerOptions: PolarisServerOptions = {
                typeDefs: {} as any,
                resolvers: {} as any,
                port: 8080,
                middlewareConfiguration,
            };
            const polarisServerConfig: PolarisServerConfig = getPolarisServerConfigFromOptions(
                polarisServerOptions,
            );
            expect(polarisServerConfig.middlewareConfiguration).toBe(middlewareConfiguration);
        });
    });

    describe('logger configuration', () => {
        test('providing options without logger properties, created logger with default configuration', () => {
            const polarisServerOptions: PolarisServerOptions = {
                typeDefs: {} as any,
                resolvers: {} as any,
                port: 8080,
            };
            getPolarisServerConfigFromOptions(polarisServerOptions);
            expect(createPolarisLoggerFromPolarisServerOptions).toHaveBeenCalledWith(
                {
                    loggerLevel: 'info',
                    writeToConsole: true,
                    writeFullMessageToConsole: false,
                },
                expect.anything(),
            );
        });

        test('providing options with logger properties, created logger with provided configuration', () => {
            const loggerConfiguration: LoggerConfiguration = {
                loggerLevel: 'debug',
                writeToConsole: false,
            };
            const polarisServerOptions: PolarisServerOptions = {
                typeDefs: {} as any,
                resolvers: {} as any,
                port: 8080,
                logger: loggerConfiguration,
            };
            getPolarisServerConfigFromOptions(polarisServerOptions);
            expect(createPolarisLoggerFromPolarisServerOptions).toHaveBeenCalledWith(
                loggerConfiguration,
                expect.anything(),
            );
        });
    });

    describe('subscription configuration', () => {
        test('providing options without allowing subscription, subscription is not allowed', () => {
            const polarisServerOptions: PolarisServerOptions = {
                typeDefs: {} as any,
                resolvers: {} as any,
                port: 8080,
            };
            const polarisServerConfig: PolarisServerConfig = getPolarisServerConfigFromOptions(
                polarisServerOptions,
            );
            expect(polarisServerConfig.allowSubscription).toBeFalsy();
        });

        test('providing options with allowed subscription, subscription is allowed', () => {
            const polarisServerOptions: PolarisServerOptions = {
                typeDefs: {} as any,
                resolvers: {} as any,
                port: 8080,
                allowSubscription: true,
            };
            const polarisServerConfig: PolarisServerConfig = getPolarisServerConfigFromOptions(
                polarisServerOptions,
            );
            expect(polarisServerConfig.allowSubscription).toBeTruthy();
        });
    });

    describe('warning configuration', () => {
        test('providing options without allowing warning, warnings are allowed', () => {
            const polarisServerOptions: PolarisServerOptions = {
                typeDefs: {} as any,
                resolvers: {} as any,
                port: 8080,
            };
            const polarisServerConfig: PolarisServerConfig = getPolarisServerConfigFromOptions(
                polarisServerOptions,
            );
            expect(polarisServerConfig.shouldAddWarningsToExtensions).toBeTruthy();
        });

        test('providing options with disallowed warnings, warnings are not allowed', () => {
            const polarisServerOptions: PolarisServerOptions = {
                typeDefs: {} as any,
                resolvers: {} as any,
                port: 8080,
                shouldAddWarningsToExtensions: false,
            };
            const polarisServerConfig: PolarisServerConfig = getPolarisServerConfigFromOptions(
                polarisServerOptions,
            );
            expect(polarisServerConfig.shouldAddWarningsToExtensions).toBeFalsy();
        });
    });

    describe('mandatory headers configuration', () => {
        test('providing options without allowing mandatory headers, mandatory headers is not allowed', () => {
            const polarisServerOptions: PolarisServerOptions = {
                typeDefs: {} as any,
                resolvers: {} as any,
                port: 8080,
            };
            const polarisServerConfig: PolarisServerConfig = getPolarisServerConfigFromOptions(
                polarisServerOptions,
            );
            expect(polarisServerConfig.allowMandatoryHeaders).toBeFalsy();
        });

        test('providing options with allowed mandatory headers, mandatory headers is allowed', () => {
            const polarisServerOptions: PolarisServerOptions = {
                typeDefs: {} as any,
                resolvers: {} as any,
                port: 8080,
                allowMandatoryHeaders: true,
            };
            const polarisServerConfig: PolarisServerConfig = getPolarisServerConfigFromOptions(
                polarisServerOptions,
            );
            expect(polarisServerConfig.allowMandatoryHeaders).toBeTruthy();
        });
    });

    describe('supported realities configuration', () => {
        test('providing options without supported realities, returning default supported realities', () => {
            const polarisServerOptions: PolarisServerOptions = {
                typeDefs: {} as any,
                resolvers: {} as any,
                port: 8080,
            };
            const polarisServerConfig: PolarisServerConfig = getPolarisServerConfigFromOptions(
                polarisServerOptions,
            );
            expect(polarisServerConfig.supportedRealities).toEqual(
                new RealitiesHolder(
                    new Map([
                        [
                            0,
                            {
                                id: 0,
                                type: 'real',
                                name: 'default',
                            },
                        ],
                    ]),
                ),
            );
        });

        test('providing options with supported realities, returning provided supported realities', () => {
            const supportedRealities: RealitiesHolder = new RealitiesHolder(
                new Map([
                    [
                        0,
                        {
                            id: 0,
                            type: 'what',
                            name: 'foo',
                        },
                    ],
                    [
                        1,
                        {
                            id: 1,
                            type: 'wow',
                            name: 'bar',
                        },
                    ],
                    [
                        2,
                        {
                            id: 2,
                            type: 'happy',
                            name: 'joy',
                        },
                    ],
                ]),
            );
            const polarisServerOptions: PolarisServerOptions = {
                typeDefs: {} as any,
                resolvers: {} as any,
                port: 8080,
                supportedRealities,
            };
            const polarisServerConfig: PolarisServerConfig = getPolarisServerConfigFromOptions(
                polarisServerOptions,
            );
            expect(polarisServerConfig.supportedRealities).toBe(supportedRealities);
        });

        test('providing options with supported realities excluding reality zero, returning provided supported realities with reality zero', () => {
            const supportedRealities: RealitiesHolder = new RealitiesHolder(
                new Map([
                    [
                        1,
                        {
                            id: 1,
                            type: 'wow',
                            name: 'bar',
                        },
                    ],
                    [
                        2,
                        {
                            id: 2,
                            type: 'happy',
                            name: 'joy',
                        },
                    ],
                ]),
            );
            const polarisServerOptions: PolarisServerOptions = {
                typeDefs: {} as any,
                resolvers: {} as any,
                port: 8080,
                supportedRealities,
            };
            const polarisServerConfig: PolarisServerConfig = getPolarisServerConfigFromOptions(
                polarisServerOptions,
            );
            expect(polarisServerConfig.supportedRealities.hasReality(0)).toBeTruthy();
        });
    });

    describe('snapshot configuration', () => {
        test('providing options without snapshot configuration, returning default snapshot configuration', () => {
            const polarisServerOptions: PolarisServerOptions = {
                typeDefs: {} as any,
                resolvers: {} as any,
                port: 8080,
            };
            const polarisServerConfig: PolarisServerConfig = getPolarisServerConfigFromOptions(
                polarisServerOptions,
            );
            expect(polarisServerConfig.snapshotConfig).toEqual({
                snapshotCleaningInterval: 60,
                secondsToBeOutdated: 60,
                maxPageSize: 50,
                entitiesAmountPerFetch: 50,
                autoSnapshot: false,
            });
        });

        test('providing options with snapshot configuration, returning provided snapshot configuration', () => {
            const snapshotConfig: SnapshotConfiguration = {
                autoSnapshot: false,
                entitiesAmountPerFetch: 100,
                maxPageSize: 20,
                secondsToBeOutdated: 600,
                snapshotCleaningInterval: 1200,
            };
            const polarisServerOptions: PolarisServerOptions = {
                typeDefs: {} as any,
                resolvers: {} as any,
                port: 8080,
                snapshotConfig,
            };
            const polarisServerConfig: PolarisServerConfig = getPolarisServerConfigFromOptions(
                polarisServerOptions,
            );
            expect(polarisServerConfig.snapshotConfig).toBe(snapshotConfig);
        });
    });
});
