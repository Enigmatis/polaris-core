import { Connection, ConnectionOptions, createPolarisConnection } from '@enigmatis/polaris-typeorm';
import { polarisGraphQLLogger } from './logger';

export let connection: Connection;
export async function initConnection(connectionOptions: ConnectionOptions) {
    connection = await createPolarisConnection(
        connectionOptions,
        polarisGraphQLLogger.getPolarisLogger() as any,
    );
}
