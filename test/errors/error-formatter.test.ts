import { PolarisError } from '@enigmatis/polaris-common';
import { AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server-express';
import * as status from 'http-status';
import { formatError } from '../../src';

describe('formatError tests', () => {
    test('calling formatError with UserInputError, bad request status code is inside the extensions ', () => {
        const error = {
            originalError: new UserInputError('test'),
            extensions: {},
        };
        const formattedError = formatError(error);
        expect(formattedError.extensions.httpStatusCode).toBe(status.BAD_REQUEST);
    });
    test('calling formatError with AuthenticationError, unauthorized status code is inside the extensions', () => {
        const error = {
            originalError: new AuthenticationError('test'),
            extensions: {},
        };
        const formattedError = formatError(error);
        expect(formattedError.extensions.httpStatusCode).toBe(status.UNAUTHORIZED);
    });
    test('calling formatError with ForbiddenError, forbidden status code is inside the extensions', () => {
        const error = {
            originalError: new ForbiddenError('test'),
            extensions: {},
        };
        const formattedError = formatError(error);
        expect(formattedError.extensions.httpStatusCode).toBe(status.FORBIDDEN);
    });
    test('calling formatError with default Error, internal server error status code is inside the extensions', () => {
        const error = {
            originalError: new Error('test'),
            extensions: {},
        };
        const formattedError = formatError(error);
        expect(formattedError.extensions.httpStatusCode).toBe(status.INTERNAL_SERVER_ERROR);
    });
    test('calling formatError with PolarisError, httpStatusCode is inside the extensions', () => {
        const httpStatusCode = 404;
        const error = {
            originalError: new PolarisError('test', httpStatusCode),
            extensions: {},
        };
        const formattedError = formatError(error);
        expect(formattedError.extensions.httpStatusCode).toBe(httpStatusCode);
    });

    test('calling formatError with error that includes extensions, extensions are passed', () => {
        const httpStatusCode = 404;
        const extensions = { hello: 'world' };
        const error = {
            originalError: new PolarisError('test', httpStatusCode, extensions),
            extensions: {},
        };
        const formattedError = formatError(error);
        expect(formattedError.extensions).toMatchObject(extensions);
    });
});
