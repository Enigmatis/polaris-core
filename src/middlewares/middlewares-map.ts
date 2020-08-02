import { RealitiesHolder } from '@enigmatis/polaris-common';
import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import {
    DataVersionMiddleware,
    IrrelevantEntitiesMiddleware,
    RealitiesMiddleware,
    SoftDeleteMiddleware,
} from '@enigmatis/polaris-middlewares';
import { PolarisConnectionManager } from '@enigmatis/polaris-typeorm';

export const getMiddlewaresMap = (
    logger: PolarisGraphQLLogger,
    realitiesHolder: RealitiesHolder,
    connectionManager?: PolarisConnectionManager,
): Map<string, any[]> => {
    const softDeleteMiddleware = new SoftDeleteMiddleware(logger).getMiddleware();
    const realitiesMiddleware = new RealitiesMiddleware(logger, realitiesHolder).getMiddleware();
    const dataVersionMiddleware = new DataVersionMiddleware(
        logger,
        realitiesHolder,
        connectionManager,
    ).getMiddleware();
    const irrelevantEntitiesMiddleware = new IrrelevantEntitiesMiddleware(
        logger,
        realitiesHolder,
        connectionManager,
    ).getMiddleware();

    return new Map([
        ['allowSoftDeleteMiddleware', [softDeleteMiddleware]],
        ['allowRealityMiddleware', [realitiesMiddleware]],
        [
            'allowDataVersionAndIrrelevantEntitiesMiddleware',
            [dataVersionMiddleware, irrelevantEntitiesMiddleware],
        ],
    ]);
};
