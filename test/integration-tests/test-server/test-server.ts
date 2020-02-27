import { RealitiesHolder } from '@enigmatis/polaris-common';
import { ConnectionOptions, getPolarisConnectionManager } from '@enigmatis/polaris-typeorm';
import { PolarisServer } from '../../../src';
import { initConnection } from './connection-manager';
import { loggerConfig } from './logger';
import * as polarisProperties from './polaris-properties.json';
import { resolvers } from './schema/resolvers';
import { typeDefs } from './schema/type-defs';

export const connectionOptions: ConnectionOptions = {
    type: 'postgres',
    url: process.env.CONNECTION_STRING || '',
    entities: [__dirname + '/dal/*.ts'],
    synchronize: true,
    logging: true,
};

export async function startTestServer(): Promise<PolarisServer> {
    jest.setTimeout(150000);
    await initConnection(connectionOptions);
    const server = new PolarisServer({
        typeDefs,
        resolvers,
        port: polarisProperties.port,
        logger: loggerConfig,
        supportedRealities: new RealitiesHolder(
            new Map([[3, { id: 3, type: 'notreal3', name: 'default' }]]),
        ),
        connection: getPolarisConnectionManager().get(),
    });
    await server.start();
    return server;
}

export async function stopTestServer(server: PolarisServer) {
    await server.stop();
    if (getPolarisConnectionManager().connections.length > 0) {
        await getPolarisConnectionManager()
            .get()
            .close();
    }
}
