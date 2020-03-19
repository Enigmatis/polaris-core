import { ConnectionOptions, createPolarisConnection } from '@enigmatis/polaris-typeorm';
import { polarisGraphQLLogger } from '../utils/logger';

export async function initConnection(connectionOptions: ConnectionOptions) {
    await createPolarisConnection(connectionOptions, polarisGraphQLLogger as any);
}
