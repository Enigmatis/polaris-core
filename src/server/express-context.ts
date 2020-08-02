import express from 'express';
import { ExecutionParams } from 'subscriptions-transport-ws';

export interface ExpressContext {
    req: express.Request;
    res: express.Response;
    connection?: ExecutionParams;
}
