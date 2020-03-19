import { PolarisServer, PolarisServerOptions } from '../../../src';
import { initializeDatabase } from '../server/dal/data-initalizer';
import { startTestServer, stopTestServer } from '../server/test-server';
import { graphqlRawRequest } from '../server/utils/graphql-client';
import * as booksWithWarnings from './jsonRequestsAndHeaders/queryForBooksWithWarnings.json';

let polarisServer: PolarisServer;

describe('warnings disabled tests', () => {
    describe('shouldAddWarningsToExtensions is false', () => {
        beforeEach(async () => {
            const warningConfig: Partial<PolarisServerOptions> = {
                shouldAddWarningsToExtensions: false,
            };
            polarisServer = await startTestServer(warningConfig);
            await initializeDatabase();
        });

        afterEach(async () => {
            await stopTestServer(polarisServer);
        });

        it('should not return warnings in the extensions of the response', async () => {
            const result = await graphqlRawRequest(
                booksWithWarnings.request,
                booksWithWarnings.headers,
            );
            expect(result.extensions.warnings).toBeUndefined();
        });
    });
});
