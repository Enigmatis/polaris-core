import { ApolloError } from 'apollo-server-express';

export class PolarisError extends ApolloError {
    constructor(
        message: string,
        httpStatusCode: number,
        extensions?: { [key: string]: any },
        code?: string,
    ) {
        if (httpStatusCode < 100 || httpStatusCode > 600) {
            throw new Error('Http status code must be greater than 99 and less than 600');
        }
        super(message, code, { ...extensions, httpStatusCode });
    }
}
