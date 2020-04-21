import { ConnectionOptions, createPolarisConnection } from '@enigmatis/polaris-typeorm';
import { polarisGraphQLLogger } from '../utils/logger';

export async function initConnection(connectionOptions: ConnectionOptions) {
    const connection = await createPolarisConnection(
        connectionOptions,
        polarisGraphQLLogger as any,
    );
    const tables = ['book', 'author', 'data_version'];
    for (const table of tables) {
        if (connection) {
            try {
                const tableRepo = connection.getRepository(table);
                await tableRepo.query(
                    'DELETE FROM "' + tableRepo.metadata.schema + '"."' + table + '";',
                );
            } catch (e) {
                polarisGraphQLLogger.debug(
                    "Couldn't delete table (might never existed)",
                    {} as any,
                );
            }
        }
    }
}
