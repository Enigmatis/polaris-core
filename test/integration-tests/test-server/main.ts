import { getPolarisConnectionManager } from '@enigmatis/polaris-typeorm';
import { PolarisServer } from '../../../src';
import { initConnection } from './connection-manager';
import { initializeDatabase } from './data-initalizer';
import { polarisGraphQLLogger } from './logger';
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
        logger: polarisGraphQLLogger,
        connection: getPolarisConnectionManager().get(),
    });
    await server.start();
};

startApp().catch(async e => {
    await server.stop();
    process.exit(0);
});
