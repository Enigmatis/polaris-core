import { CommonModel, ConnectionOptions, DataVersion } from '@enigmatis/polaris-typeorm';
import { PolarisServer } from '../../../src/index';
import { connection, initConnection } from './connection-manager';
import { initializeDatabase } from './data-initalizer';
import { loggerConfig } from './logger';
import * as polarisProperties from './polaris-properties.json';
import { resolvers } from './schema/resolvers';
import { typeDefs } from './schema/type-defs';

let server: PolarisServer;
const connectionOptions: ConnectionOptions = {
    type: 'postgres',
    url: process.env.CONNECTION_STRING || '',
    entities: [__dirname + '/dal/*.ts', CommonModel, DataVersion],
    synchronize: false,
    logging: true,
};
const startApp = async () => {
    await initConnection(connectionOptions);
    await initializeDatabase();
    server = new PolarisServer({
        typeDefs,
        resolvers,
        port: polarisProperties.port,
        loggerConfiguration: loggerConfig,
        connection,
    });
    await server.start();
};
try {
    startApp();
} catch (e) {
    if (server) {
        server.stop();
    }
    process.exit(0);
}
