import request from 'supertest';
import express from 'express';
import { healthRouter } from '../src/routes/healthRoutes';

const app = express();
app.use(healthRouter);

describe('Health endpoint', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
