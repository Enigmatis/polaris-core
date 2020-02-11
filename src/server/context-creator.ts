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

export const getPolarisContext = ({ req, res, connection }: any): PolarisGraphQLContext => {
    const headers = req ? req.headers : connection.context;
    const body = req ? req.body : connection;

    const requestId = headers[REQUEST_ID] || uuid();
    const upn = headers[OICD_CLAIM_UPN];
    const realityId = +headers[REALITY_ID] || 0;
    return {
        requestHeaders: {
            upn,
            requestId,
            realityId,
            dataVersion: +headers[DATA_VERSION],
            includeLinkedOper: headers[INCLUDE_LINKED_OPER] === 'true',
            requestingSystemId: headers[REQUESTING_SYS],
            requestingSystemName: headers[REQUESTING_SYS_NAME],
        },
        responseHeaders: {
            upn,
            requestId,
            realityId,
        },
        clientIp: getIpAddress(),
        request: {
            query: body.query,
            operationName: body.operationName,
            polarisVariables: body.variables,
        },
        response: res,
        returnedExtensions: {} as any,
    };
};
