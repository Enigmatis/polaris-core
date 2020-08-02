import { PolarisServer } from '../../../src';
import { startTestServer, stopTestServer } from '../server-without-connection/test-server';
import { graphQLRequest } from '../server/utils/graphql-client';

let polarisServer: PolarisServer;

beforeEach(async () => {
    polarisServer = await startTestServer();
});

afterEach(async () => {
    return stopTestServer(polarisServer);
});

describe('directives tests', () => {
    it('query a field with directive, directive logic activated', async () => {
        const result: any = await graphQLRequest(
            `
                {
                    allBooks {
                        coverColor
                    }
                }
            `,
            {},
        );
        expect(result.allBooks[0].coverColor).toEqual('RED');
        expect(result.allBooks[1].coverColor).toEqual('ORANGE');
        expect(result.allBooks[2].coverColor).toEqual('GREEN');
    });
});
