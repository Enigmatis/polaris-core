import { PolarisGraphQLLogger } from '@enigmatis/polaris-graphql-logger';
import {
    DataVersionMiddleware,
    IrrelevantEntitiesMiddleware,
    RealitiesMiddleware,
    SoftDeleteMiddleware,
} from '@enigmatis/polaris-middlewares';
import { Connection } from '@enigmatis/polaris-typeorm';

export const getMiddlewaresMap = (
    logger: PolarisGraphQLLogger,
    connection?: Connection,
): Map<string, any[]> => {
    const dataVersionMiddleware = new DataVersionMiddleware(logger, connection).getMiddleware;
    const irrelevantEntitiesMiddleware = new IrrelevantEntitiesMiddleware(logger, connection)
        .getMiddleware;
    const realitiesMiddleware = new RealitiesMiddleware(logger).getMiddleware;
    const softDeleteMiddleware = new SoftDeleteMiddleware(logger).getMiddleware;

    return new Map([
        [
            'allowDataVersionAndIrrelevantEntitiesMiddleware',
            [dataVersionMiddleware, irrelevantEntitiesMiddleware],
        ],
        ['allowSoftDeleteMiddleware', [realitiesMiddleware]],
        ['allowRealityMiddleware', [softDeleteMiddleware]],
    ]);
};
