import { RealitiesHolder } from '@enigmatis/polaris-common';
import { ConnectionOptions, getPolarisConnectionManager } from '@enigmatis/polaris-typeorm';
import { ExpressContext, PolarisServer } from '../../../src';
import { initConnection } from './connection-manager';
import { loggerConfig } from './logger';
import * as polarisProperties from './polaris-properties.json';
import { resolvers } from './schema/resolvers';
import { typeDefs } from './schema/type-defs';
import { TestContext } from './test-context';

export const connectionOptions: ConnectionOptions = {
    type: 'postgres',
    url: process.env.CONNECTION_STRING || '',
    entities: [__dirname + '/dal/*.ts'],
    synchronize: true,
    logging: true,
};

const customContext = (context: ExpressContext): Partial<TestContext> => {
    const { req } = context;
    return {
        customField: 1000,
        requestHeaders: {
            customHeader: req.headers['custom-header'],
        },
    };
};

const getCustomContext = (
    context: ExpressContext,
    customCtx?: Partial<TestContext>,
): Partial<TestContext> => {
    if (customCtx) {
        return customCtx;
    } else {
        return customContext(context);
    }
};

export async function startTestServer(
    customCtx?: Partial<TestContext>,
    shouldAddWarningsToExtensions?: boolean,
): Promise<PolarisServer> {
    jest.setTimeout(150000);
    await initConnection(connectionOptions);
    const server = new PolarisServer({
        typeDefs,
        resolvers,
        customContext: (context: ExpressContext) => getCustomContext(context, customCtx),
        port: polarisProperties.port,
        logger: loggerConfig,
        shouldAddWarningsToExtensions,
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
