import { PolarisServer } from '../../../src';
import * as polarisProperties from './polaris-properties.json';
import { resolvers } from './schema/resolvers';
import { typeDefs } from './schema/type-defs';

export async function startTestServer(): Promise<PolarisServer> {
    jest.setTimeout(150000);
    const server = new PolarisServer({
        typeDefs,
        resolvers,
        port: polarisProperties.port,
        applicationProperties: {
            id: polarisProperties.id,
            name: polarisProperties.name,
            version: polarisProperties.version,
            environment: polarisProperties.environment,
            component: polarisProperties.component,
        },
    });

    await server.start();
    return server;
}

export async function stopTestServer(server: PolarisServer) {
    await server.stop();
}
