import { PolarisGraphQLContext, PolarisRequestHeaders } from '../../../../src';
import { TestClassInContext } from './test-class-in-context';

interface TestRequestHeaders extends PolarisRequestHeaders {
    customHeader?: string | string[];
}

export interface TestContext extends PolarisGraphQLContext {
    customField: number;
    requestHeaders: TestRequestHeaders;
    instanceInContext: TestClassInContext;
}
