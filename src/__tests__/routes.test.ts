import request from 'supertest';
import express from 'express';
import { router } from '../routes';
import * as database from '../database';

// Mock the database module
jest.mock('../database', () => ({
  storeCredential: jest.fn(),
  credentialExists: jest.fn()
}));

const app = express();
app.use(express.json());
app.use(router);

describe('Issuance Service Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.WORKER_ID = 'test-worker';
  });

  test('POST /issue should issue a credential successfully', async () => {
    // Mock database functions
    (database.credentialExists as jest.Mock).mockResolvedValue(false);
    (database.storeCredential as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .post('/issue')
      .send({ id: 'test-id', data: { name: 'Test User' } });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Credential issued successfully',
      workerId: 'test-worker'
    });
    expect(database.credentialExists).toHaveBeenCalledWith('test-id');
    expect(database.storeCredential).toHaveBeenCalledWith('test-id', { name: 'Test User' });
  });

  test('POST /issue should return 400 if id is missing', async () => {
    const response = await request(app)
      .post('/issue')
      .send({ data: { name: 'Test User' } });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: 'Missing required fields: id and data'
    });
  });

  test('POST /issue should return 409 if credential already exists', async () => {
    // Mock database functions
    (database.credentialExists as jest.Mock).mockResolvedValue(true);

    const response = await request(app)
      .post('/issue')
      .send({ id: 'existing-id', data: { name: 'Test User' } });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      success: false,
      message: 'Credential with this ID already exists'
    });
    expect(database.credentialExists).toHaveBeenCalledWith('existing-id');
    expect(database.storeCredential).not.toHaveBeenCalled();
  });
});