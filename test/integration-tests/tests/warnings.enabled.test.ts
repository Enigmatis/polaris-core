import { PolarisServer } from '../../../src';
import { initializeDatabase } from '../test-server/data-initalizer';
import { graphqlRawRequest } from '../test-server/graphql-client';
import { startTestServerWithWarnings, stopTestServer } from '../test-server/test-server';
import * as booksWithWarnings from './jsonRequestsAndHeaders/queryForBooksWithWarnings.json';

let polarisServer: PolarisServer;

describe('warnings tests - shouldAddWarningsToExtensions is true', () => {
    beforeEach(async () => {
        polarisServer = await startTestServerWithWarnings(true);
        await initializeDatabase();
    });

    afterEach(async () => {
        await stopTestServer(polarisServer);
    });

    it('warnings in the extensions of the response should be defined', async () => {
        const result = await graphqlRawRequest(
            booksWithWarnings.request,
            booksWithWarnings.headers,
        );
        expect(result.extensions.warnings).toBeDefined();
    });

    it('the relevant warnings should be returned in the extensions of the response', async () => {
        const result = await graphqlRawRequest(
            booksWithWarnings.request,
            booksWithWarnings.headers,
        );
        expect(result.extensions.warnings.length).toBe(2);
        expect(result.extensions.warnings[0]).toEqual('warning 1');
        expect(result.extensions.warnings[1]).toEqual('warning 2');
    });
});
