import { RealitiesHolder } from '@enigmatis/polaris-common';
import { ConnectionOptions, getPolarisConnectionManager } from '@enigmatis/polaris-typeorm';
import { ExpressContext, PolarisServer, PolarisServerOptions } from '../../../src';
import { initConnection } from './dal/connection-manager';
import { loggerConfig } from './utils/logger';
import * as polarisProperties from './resources/polaris-properties.json';
import { resolvers } from './schema/resolvers';
import { typeDefs } from './schema/type-defs';
import { TestContext } from './context/test-context';

export const connectionOptions: ConnectionOptions = {
    type: 'postgres',
    url: process.env.CONNECTION_STRING || '',
    entities: [__dirname + '/dal/*.ts'],
    synchronize: true,
    logging: true,
};

const customContext = (context: ExpressContext): Partial<TestContext> => {
    const { req, connection } = context;
    const headers = req ? req.headers : connection?.context;

    return {
        customField: 1000,
        requestHeaders: {
            customHeader: headers['custom-header'],
        },
    };
};

export async function startTestServer(config?: PolarisServerOptions): Promise<PolarisServer> {
    await initConnection(connectionOptions);
    const options = config || defaultTestServerConfig;
    const server = new PolarisServer(options);
    await server.start();
    return server;
}

export async function stopTestServer(server: PolarisServer): Promise<void> {
    await server.stop();
    if (getPolarisConnectionManager().connections.length > 0) {
        await getPolarisConnectionManager()
            .get()
            .close();
    }
}

export async function startTestServerWithoutConnection(): Promise<PolarisServer> {
    const server = new PolarisServer({
        typeDefs,
        resolvers,
        port: polarisProperties.port,
    });
    await server.start();
    return server;
}

export async function stopTestServerWithoutConnection(server: PolarisServer): Promise<void> {
    await server.stop();
}

export const defaultTestServerConfig: PolarisServerOptions = {
    typeDefs,
    resolvers,
    customContext,
    port: polarisProperties.port,
    logger: loggerConfig,
    supportedRealities: new RealitiesHolder(
        new Map([[3, { id: 3, type: 'notreal3', name: 'default' }]]),
    ),
    connection: getPolarisConnectionManager().get(),
};