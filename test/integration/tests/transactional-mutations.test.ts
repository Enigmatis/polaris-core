import { PolarisServer } from '../../../src';
import { initializeDatabase } from '../server/dal/data-initalizer';
import { startTestServer, stopTestServer } from '../server/test-server';
import { graphqlRawRequest, graphQLRequest } from '../server/utils/graphql-client';
import * as authorById from './jsonRequestsAndHeaders/authorById.json';
import * as authorByFirstName from './jsonRequestsAndHeaders/authorsByFirstName.json';
import * as multipleMutationsWithBrokenOne from './jsonRequestsAndHeaders/multipleMutationsWithBrokenOne.json';
import * as mutation from './jsonRequestsAndHeaders/mutation.json';
import * as simpleQuery from './jsonRequestsAndHeaders/simpleQuery.json';

let polarisServer: PolarisServer;

const authors = [
    {
        firstName: 'Amos',
        lastName: 'Oz',
    },
    {
        firstName: 'itay',
        lastName: 'kl',
    },
];
const failMutationVars = {
    ...authors[0],
    fName: authors[1].firstName,
    lName: authors[1].lastName,
};
describe('transactional mutations enabled integration tests', () => {
    beforeEach(async () => {
        polarisServer = await startTestServer();
        await initializeDatabase();
    });

    afterEach(async () => {
        await stopTestServer(polarisServer);
    });
    it('create author, author created', async () => {
        const response: any = await graphQLRequest(mutation.request, mutation.headers, authors[0]);
        const authorFound: any = await graphQLRequest(authorById.request, authorById.headers, {
            id: response.createAuthor.id,
        });
        expect(authorFound.authorById.firstName).toEqual(authors[0].firstName);
    });

    it('multiple mutations in one request, second mutation fails, response is correct', async () => {
        expect.assertions(5);
        let dv;
        try {
            dv = (await graphqlRawRequest(simpleQuery.request, simpleQuery.headers)).extensions
                .globalDataVersion;
            await graphqlRawRequest(
                multipleMutationsWithBrokenOne.request,
                undefined,
                failMutationVars,
            );
        } catch (e) {
            expect(e.response.errors.length).toBe(1);
            expect(e.response.errors[0].message).toBe('fail');
            expect(e.response.errors[0].path).toEqual(['b']);
            expect(e.response.data).toBeNull();
            expect(e.response.extensions).toBe({ globalDataVersion: dv });
        }
    });

    it("multiple mutations in one request, second mutation fails, data in db wasn't changed", async () => {
        const dataVersionBeforeUpdate = (
            await graphqlRawRequest(simpleQuery.request, simpleQuery.headers)
        ).extensions.globalDataVersion;
        await expect(
            graphQLRequest(multipleMutationsWithBrokenOne.request, undefined, failMutationVars),
        ).rejects.toThrow('fail');
        const result: any = await graphqlRawRequest(authorByFirstName.requestTwice, undefined, {
            name: authors[0].firstName,
            name2: authors[1].firstName,
        });
        expect(result.extensions.globalDataVersion).toEqual(dataVersionBeforeUpdate);
        expect(result.data.a.length).toEqual(0);
        expect(result.data.b.length).toEqual(0);
    });
});
