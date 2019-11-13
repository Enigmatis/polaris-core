import { PolarisError } from '../../src';

describe('PolarisError tests', () => {
    test('creating PolarisError with valid http status code, http status code is in extensions', () => {
        const httpStatusCode: number = 404;
        const err: PolarisError = new PolarisError('error message', httpStatusCode);
        expect(err.extensions).toMatchObject({ httpStatusCode });
    });
    test('creating PolarisError with invalid http status code, error is thrown', () => {
        const invalidHttpStatusCode: number = 666;
        expect(() => new PolarisError('error message', invalidHttpStatusCode)).toThrow();
    });
});
