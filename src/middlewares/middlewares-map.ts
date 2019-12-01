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
    const softDeleteMiddleware = new SoftDeleteMiddleware(logger).getMiddleware();
    const realitiesMiddleware = new RealitiesMiddleware(logger).getMiddleware();
    const dataVersionMiddleware = new DataVersionMiddleware(logger, connection).getMiddleware();
    const irrelevantEntitiesMiddleware = new IrrelevantEntitiesMiddleware(
        logger,
        connection,
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
