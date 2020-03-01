import { PolarisGraphQLContext, PolarisRequestHeaders } from '../../../src';

interface TestRequestHeaders extends PolarisRequestHeaders {
    testHeader?: string | string[];
}

export interface TestContext extends PolarisGraphQLContext {
    testField: number;
    requestHeaders: TestRequestHeaders;
}
