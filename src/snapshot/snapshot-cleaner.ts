import { RealitiesHolder, Reality } from '@enigmatis/polaris-common';
import { getConnectionForReality, SnapshotPage } from '@enigmatis/polaris-typeorm';

export const deleteOutdatedSnapshotPages = (
    realitiesHolder: RealitiesHolder,
    secondsToBeOutdated: number,
): void => {
    realitiesHolder.getRealitiesMap().forEach(async (reality: Reality) => {
        const snapshotRepository = getConnectionForReality(
            reality.id,
            realitiesHolder,
        ).getRepository(SnapshotPage);
        await snapshotRepository.query(`DELETE FROM "snapshot_page" 
                                        WHERE EXTRACT(EPOCH FROM (NOW() - "creationTime")) > ${secondsToBeOutdated};`);
    });
};
