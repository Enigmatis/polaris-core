import { GraphQLClient } from 'graphql-request';
import * as polarisProperties from '../resources/polaris-properties.json';

export const url = `http://localhost:${polarisProperties.port}/${polarisProperties.version}/graphql`;

export const graphQLRequest = async (data: string, headers: any, variables: any = undefined) => {
    const graphQLClient = new GraphQLClient(url, { headers });
    return graphQLClient.request(data, variables);
};

export const graphqlRawRequest = async (data: string, headers: any, variables: any = undefined) => {
    const graphQLClient = new GraphQLClient(url, { headers });
    return graphQLClient.rawRequest(data, variables);
};
