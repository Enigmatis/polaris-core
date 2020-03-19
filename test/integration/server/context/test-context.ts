import { PolarisGraphQLContext, PolarisRequestHeaders } from '../../../../src';

export class TestClassInContext {
    public someProperty?: number;

    constructor(somePropertyInitialValue: number) {
        this.someProperty = somePropertyInitialValue;
    }

    public doSomething(): string {
        return `did something successfully with someProperty of ${this.someProperty}`;
    }
}

interface TestRequestHeaders extends PolarisRequestHeaders {
    customHeader?: string | string[];
}

export interface TestContext extends PolarisGraphQLContext {
    customField: number;
    requestHeaders: TestRequestHeaders;
    instanceInContext: TestClassInContext;
}
