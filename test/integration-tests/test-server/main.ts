import { getConnectionManager } from '@enigmatis/polaris-typeorm';
import { PolarisServer } from '../../../src';
import { initConnection } from './connection-manager';
import { initializeDatabase } from './data-initalizer';
import { loggerConfig } from './logger';
import * as polarisProperties from './polaris-properties.json';
import { resolvers } from './schema/resolvers';
import { typeDefs } from './schema/type-defs';
import { connectionOptions } from './test-server';

let server: PolarisServer;
const startApp = async () => {
    await initConnection(connectionOptions);
    await initializeDatabase();
    server = new PolarisServer({
        typeDefs,
        resolvers,
        port: polarisProperties.port,
        logger: loggerConfig,
        connection: getConnectionManager().get(),
    });
    await server.start();
};

startApp().catch(async e => {
    await server.stop();
    process.exit(0);
});
