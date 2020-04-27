import {
    ConnectionOptions,
    createPolarisConnection,
    PolarisConnection,
} from '@enigmatis/polaris-typeorm';
import { polarisGraphQLLogger } from '../utils/logger';

export async function initConnection(connectionOptions: ConnectionOptions) {
    const connection = await createPolarisConnection(
        connectionOptions,
        polarisGraphQLLogger as any,
    );
    await deleteTables(connection);
}
export async function deleteTables(connection: PolarisConnection): Promise<void> {
    const tables = ['book', 'author', 'data_version', 'snapshot_page'];
    for (const table of tables) {
        if (connection) {
            try {
                const tableRepo = connection.getRepository(table);
                const schema = tableRepo.metadata.schema;
                const path = schema ? schema + '"."' + table : table;
                await tableRepo.query('DELETE FROM "' + path + '";');
            } catch (e) {
                polarisGraphQLLogger.debug(
                    "Couldn't delete table (might never existed)",
                    {} as any,
                );
            }
        }
    }
}
