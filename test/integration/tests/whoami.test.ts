import { PolarisServer } from '../../../src';
import { startTestServer, stopTestServer } from '../server-without-connection/test-server';
import * as polarisProperties from '../server-without-connection/resources/polaris-properties.json';
import axios from 'axios';

let polarisServer: PolarisServer;

beforeEach(async () => {
    polarisServer = await startTestServer();
});

afterEach(async () => {
    return stopTestServer(polarisServer);
});

describe('whoami tests', () => {
    test('get request for whoami endpoint, returning a valid response', async () => {
        const url = `http://localhost:${polarisProperties.port}/whoami`;
        const result = await axios(url);
        expect(result.data.service).toBe(polarisProperties.name);
        expect(result.data.version).toBe(polarisProperties.version);
    });
});
