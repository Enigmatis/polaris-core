import {
    DATA_VERSION,
    INCLUDE_LINKED_OPER,
    OICD_CLAIM_UPN,
    PolarisGraphQLContext,
    REALITY_ID,
    REQUEST_ID,
    REQUESTING_SYS,
    REQUESTING_SYS_NAME,
} from '@enigmatis/polaris-common';
import { address as getIpAddress } from 'ip';
import { v4 as uuid } from 'uuid';

export const getPolarisContext = (context: any): PolarisGraphQLContext => {
    const httpHeaders = context.req.headers;
    const requestId = httpHeaders[REQUEST_ID] || uuid();
    const upn = httpHeaders[OICD_CLAIM_UPN];
    const realityId = +httpHeaders[REALITY_ID];
    return {
        requestHeaders: {
            upn,
            requestId,
            realityId,
            dataVersion: +httpHeaders[DATA_VERSION],
            includeLinkedOper: httpHeaders[INCLUDE_LINKED_OPER] === 'true',
            requestingSystemId: httpHeaders[REQUESTING_SYS],
            requestingSystemName: httpHeaders[REQUESTING_SYS_NAME],
        },
        responseHeaders: {
            upn,
            requestId,
            realityId,
        },
        clientIp: getIpAddress(),
        request: {
            query: context.req.body.query,
            operationName: context.req.body.operationName,
            polarisVariables: context.req.body.variables,
        },
        response: context.res,
        returnedExtensions: {} as any,
    };
};
