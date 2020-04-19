import { RealitiesHolder, Reality } from '@enigmatis/polaris-common';
import { getConnectionForReality, SnapshotPage } from '@enigmatis/polaris-typeorm';
import { AbstractPolarisLogger } from '@enigmatis/polaris-logs';

export const deleteOutdatedSnapshotPages = (
    realitiesHolder: RealitiesHolder,
    secondsToBeOutdated: number,
    logger: AbstractPolarisLogger,
): void => {
    realitiesHolder.getRealitiesMap().forEach(async (reality: Reality) => {
        const snapshotRepository = getConnectionForReality(
            reality.id,
            realitiesHolder,
        ).getRepository(SnapshotPage);
        await snapshotRepository.query(`DELETE FROM ${snapshotRepository.metadata.tablePath} 
                                        WHERE EXTRACT(EPOCH FROM (NOW() - "creationTime")) > ${secondsToBeOutdated};`);
        logger.debug(`Snapshot cleaner has deleted outdated entities for reality id ${reality.id}`);
    });
};
