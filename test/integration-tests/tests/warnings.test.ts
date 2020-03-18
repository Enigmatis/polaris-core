import { PolarisExtensions, PolarisWarning } from '@enigmatis/polaris-common';
import { PolarisServer } from '../../../src';
import { initializeDatabase } from '../test-server/data-initalizer';
import { graphqlRawRequest } from '../test-server/graphql-client';
import { startTestServer, stopTestServer } from '../test-server/test-server';
import * as simpleQuery from './jsonRequestsAndHeaders/simpleQuery.json';

let polarisServer: PolarisServer;

describe('warnings tests - shouldAddWarningsToExtensions is true', () => {
    beforeEach(async () => {
        const customWarnings: PolarisWarning[] = ['warning 1', 'warning 2'];
        const customExtensions: PolarisExtensions = {
            globalDataVersion: 1,
            warnings: customWarnings,
        };
        polarisServer = await startTestServer(
            {
                returnedExtensions: customExtensions,
            },
            true,
        );
        await initializeDatabase();
    });

    afterEach(async () => {
        await stopTestServer(polarisServer);
    });

    it('warnings in the extensions of the response should be defined', async () => {
        const result = await graphqlRawRequest(simpleQuery.request, simpleQuery.headers);
        expect(result.extensions.warnings).toBeDefined();
    });

    it('the relevant warnings should be returned in the extensions of the response', async () => {
        const result = await graphqlRawRequest(simpleQuery.request, simpleQuery.headers);
        expect(result.extensions.warnings.length).toBe(2);
        expect(result.extensions.warnings[0]).toEqual('warning 1');
        expect(result.extensions.warnings[1]).toEqual('warning 2');
    });
});

describe('warnings tests - shouldAddWarningsToExtensions is false', () => {
    beforeEach(async () => {
        const customWarnings: PolarisWarning[] = ['warning 1', 'warning 2'];
        const customExtensions: PolarisExtensions = {
            globalDataVersion: 1,
            warnings: customWarnings,
        };
        polarisServer = await startTestServer(
            {
                returnedExtensions: customExtensions,
            },
            false,
        );
        await initializeDatabase();
    });

    afterEach(async () => {
        await stopTestServer(polarisServer);
    });

    it('should not return warnings in the extensions of the response', async () => {
        const result = await graphqlRawRequest(simpleQuery.request, simpleQuery.headers);
        expect(result.extensions.warnings).toBeUndefined();
    });
});

describe('warnings tests - shouldAddWarningsToExtensions is undefined', () => {
    beforeEach(async () => {
        const customWarnings: PolarisWarning[] = ['warning 1', 'warning 2'];
        const customExtensions: PolarisExtensions = {
            globalDataVersion: 1,
            warnings: customWarnings,
        };
        polarisServer = await startTestServer({
            returnedExtensions: customExtensions,
        });
        await initializeDatabase();
    });

    afterEach(async () => {
        await stopTestServer(polarisServer);
    });

    it('should not return warnings in the extensions of the response', async () => {
        const result = await graphqlRawRequest(simpleQuery.request, simpleQuery.headers);
        expect(result.extensions.warnings).toBeUndefined();
    });
});
