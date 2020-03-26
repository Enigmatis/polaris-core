export interface SnapshotConfiguration {
    snapshotCleaningInterval: number;
    secondsToBeOutdated: number;
    pageSize: number;
    entitiesAmountPerFetch: number;
    autoSnapshot: boolean;

}