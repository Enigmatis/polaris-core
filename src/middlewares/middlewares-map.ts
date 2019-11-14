import {
    dataVersionMiddleware,
    realitiesMiddleware,
    softDeletedMiddleware,
} from '@enigmatis/polaris-middlewares';

export const middlewaresMap: Map<string, any[]> = new Map([
    ['allowDataVersionAndIrrelevantEntitiesMiddleware', [dataVersionMiddleware]],
    ['allowSoftDeleteMiddleware', [softDeletedMiddleware]],
    ['allowRealityMiddleware', [realitiesMiddleware]],
]);
