import { PolarisError } from '@enigmatis/polaris-common';
import { AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server-express';
import * as status from 'http-status';

export const polarisFormatError = (err: any) => {
    const formattedError = err;
    if (err.originalError instanceof UserInputError) {
        formattedError.extensions.httpStatusCode = status.BAD_REQUEST;
    } else if (err.originalError instanceof AuthenticationError) {
        formattedError.extensions.httpStatusCode = status.UNAUTHORIZED;
    } else if (err.originalError instanceof ForbiddenError) {
        formattedError.extensions.httpStatusCode = status.FORBIDDEN;
    } else if (err.originalError instanceof PolarisError) {
        formattedError.extensions = {
            ...formattedError.extensions,
            ...err.originalError.extensions,
        };
        if (formattedError.extensions.exception) {
            delete formattedError.extensions.exception.httpStatusCode;
        }
    } else {
        formattedError.extensions.httpStatusCode = status.INTERNAL_SERVER_ERROR;
    }
    return formattedError;
};
