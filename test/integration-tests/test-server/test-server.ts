import {
    CommonModel,
    ConnectionOptions,
    DataVersion,
    getConnectionManager,
} from '@enigmatis/polaris-typeorm';
import { PolarisServer } from '../../../src';
import { initConnection } from './connection-manager';
import { loggerConfig} from './logger';
import * as polarisProperties from './polaris-properties.json';
import { resolvers } from './schema/resolvers';
import { typeDefs } from './schema/type-defs';

const connectionOptions: ConnectionOptions = {
    type: 'postgres',
    url: process.env.CONNECTION_STRING || '',
    entities: [__dirname + '/dal/*.ts', CommonModel, DataVersion],
    synchronize: false,
    logging: true,
};

export async function startTestServer(): Promise<PolarisServer> {
    jest.setTimeout(150000);
    await initConnection(connectionOptions);
    const server = new PolarisServer({
        typeDefs,
        resolvers,
        port: polarisProperties.port,
        loggerConfiguration: loggerConfig,
        connection: getConnectionManager().get(),
    });
    await server.start();
    return server;
}

export async function stopTestServer(server: PolarisServer) {
    await server.stop();
    await getConnectionManager()
        .get()
        .close();
}