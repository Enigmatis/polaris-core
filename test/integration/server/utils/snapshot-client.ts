import { getPolarisConnectionManager } from '@enigmatis/polaris-typeorm';
import axios from 'axios';
import { port } from '../resources/polaris-properties.json';

export const url = `http://localhost:${port}/snapshot`;
export const metadataUrl = `http://localhost:${port}/snapshot/metadata`;

export const snapshotRequest = async (snapshotId: string) => {
    return axios(url + '?id=' + snapshotId, { method: 'get' });
};

export const metadataRequest = async (snapshotMetadataId: string) => {
    return axios(metadataUrl + '?id=' + snapshotMetadataId, { method: 'get' });
};

export const waitUntilSnapshotRequestIsDone = async (metadataId: string, delayInMs: number) => {
    let response;
    do {
        await sleep(delayInMs);
        if (!getPolarisConnectionManager().get().manager!.queryRunner!.isTransactionActive) {
            response = await metadataRequest(metadataId);
        }
    } while (response?.data.status !== 'DONE');

    function sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
