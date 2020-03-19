import { PolarisServer } from '../../../src';
import { initializeDatabase } from '../test-server/data-initalizer';
import { graphqlRawRequest } from '../test-server/graphql-client';
import { startTestServerWithWarnings, stopTestServer } from '../test-server/test-server';
import * as booksWithWarnings from './jsonRequestsAndHeaders/queryForBooksWithWarnings.json';

let polarisServer: PolarisServer;

describe('warnings tests - shouldAddWarningsToExtensions is false', () => {
    beforeEach(async () => {
        polarisServer = await startTestServerWithWarnings(false);
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
