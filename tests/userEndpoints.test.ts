import express from 'express';
import request from 'supertest';
import { userRouter } from '../src/routes/userRoutes';

// In-memory store to emulate Firestore documents
const store: Record<string, any> = {};

// Mock firebase config to return a fake Firestore interface
jest.mock('../src/config/firebase', () => ({
  firebaseDb: () => ({
    collection: (name: string) => ({
      doc: (id: string) => ({
        get: async () => ({ exists: !!store[id], data: () => store[id] }),
        set: async (data: any) => {
          store[id] = { ...(store[id] || {}), ...data };
        }
      })
    })
  })
}));

// Mock auth middleware to inject a fixed user identity
jest.mock('../src/middlewares/authMiddleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { uid: 'test-user', email: 'test@example.com' };
    next();
  }
}));

// Build minimal app
const app = express();
app.use(express.json());
app.use(userRouter);

describe('User endpoints', () => {
  it('POST /api/users/sync upserts user profile', async () => {
    const res = await request(app)
      .post('/api/users/sync')
      .send({ displayName: 'Alice', role: 'host' });
    expect(res.status).toBe(200);
    expect(res.body.data.uid).toBe('test-user');
    expect(res.body.data.displayName).toBe('Alice');
    expect(res.body.data.role).toBe('host');
    expect(res.body.data.createdAt).toBeDefined();
    expect(res.body.data.updatedAt).toBeDefined();
  });

  it('GET /api/users/me returns current user profile', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(200);
    expect(res.body.data.uid).toBe('test-user');
  });

  it('PUT /api/users/me updates editable fields', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .send({ displayName: 'Alice Updated' });
    expect(res.status).toBe(200);
    expect(res.body.data.displayName).toBe('Alice Updated');
    expect(res.body.data.status).toBe('active');
  });

  it('DELETE /api/users/me performs soft delete', async () => {
    const res = await request(app).delete('/api/users/me');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('deleted');
    expect(res.body.data.deletedAt).toBeDefined();
  });

  it('GET /api/users/me after delete still returns deleted status', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('deleted');
  });
});
