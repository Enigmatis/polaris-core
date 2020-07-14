import { RealitiesHolder } from '@enigmatis/polaris-common';
import { ConnectionOptions, getPolarisConnectionManager } from '@enigmatis/polaris-typeorm';
import { ExpressContext, PolarisServer, PolarisServerOptions } from '../../../src';
import * as customContextFields from './constants/custom-context-fields.json';
import { TestClassInContext } from './context/test-class-in-context';
import { TestContext } from './context/test-context';
import { initConnection } from './dal/connection-manager';
import { initializeDatabase } from './dal/data-initalizer';
import * as polarisProperties from './resources/polaris-properties.json';
import { resolvers } from './schema/resolvers';
import { typeDefs } from './schema/type-defs';
import { loggerConfig } from './utils/logger';

export const connectionOptions: ConnectionOptions = {
    type: 'postgres',
    url:
        'postgres://vulcan_usr@galileo-dbs:vulcan_usr123@galileo-dbs.postgres.database.azure.com:5432/vulcan_db',
    entities: [__dirname + '/dal/entities/*.{ts,js}'],
    synchronize: true,
    dropSchema: true,
    logging: true,
    schema: 'arik',
};

const customContext = (context: ExpressContext): Partial<TestContext> => {
    const { req, connection } = context;
    const headers = req ? req.headers : connection?.context;

    return {
        customField: customContextFields.customField,
        instanceInContext: new TestClassInContext(
            customContextFields.instanceInContext.someProperty,
        ),
        requestHeaders: {
            customHeader: headers['custom-header'],
        },
    };
};

export async function startTestServer(
    config?: Partial<PolarisServerOptions>,
): Promise<PolarisServer> {
    await initConnection(connectionOptions);
    const options = { ...getDefaultTestServerConfig(), ...config };
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

const getDefaultTestServerConfig = (): PolarisServerOptions => {
    return {
        typeDefs,
        resolvers,
        customContext,
        port: polarisProperties.port,
        logger: loggerConfig,
        supportedRealities: new RealitiesHolder(
            new Map([[3, { id: 3, type: 'notreal3', name: 'default' }]]),
        ),
        connectionManager: getPolarisConnectionManager(),
    };
};

async function start() {
    await startTestServer({
        snapshotConfig: {
            autoSnapshot: true,
            maxPageSize: 3,
            snapshotCleaningInterval: 60,
            secondsToBeOutdated: 600,
            entitiesAmountPerFetch: 0,
        },
    });
    await initializeDatabase();
    await initializeDatabase();
}

start();
