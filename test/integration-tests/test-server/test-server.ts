import { CommonModel, ConnectionOptions, DataVersion } from '@enigmatis/polaris-typeorm';
import { PolarisServer } from '../../../src';
import { connection, initConnection } from './connection-manager';
import { deleteTables } from './data-initalizer';
import { loggerConfig, polarisGraphQLLogger } from './logger';
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

let server: PolarisServer;

export async function startTestServer(): Promise<PolarisServer> {
    jest.setTimeout(15000);
    await initConnection(connectionOptions);
    server = new PolarisServer({
        typeDefs,
        resolvers,
        port: polarisProperties.port,
        loggerConfiguration: loggerConfig,
        connection,
    });
    await server.start();
    return server;
}

export async function stopTestServer() {
    await connection.close();
    await server.stop();
}
