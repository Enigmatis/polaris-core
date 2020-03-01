import { PolarisGraphQLContext, PolarisRequestHeaders } from '../../../src';

interface TestRequestHeaders extends PolarisRequestHeaders {
    customHeader?: string | string[];
}

export interface TestContext extends PolarisGraphQLContext {
    customField: number;
    requestHeaders: TestRequestHeaders;
}
