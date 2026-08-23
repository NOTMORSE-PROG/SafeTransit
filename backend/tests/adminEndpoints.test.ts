import { generateToken } from '../services/auth/jwt';
import { mockReq, mockRes, bearerHeader } from './helpers';

// ── Mocks ──────────────────────────────────────────────────────────────────────

// Mock neon so no real DB calls happen
jest.mock('@neondatabase/serverless', () => ({
  neon: () => {
    const sql = Object.assign(
      jest.fn().mockResolvedValue([{ count: 5 }]),
      { unsafe: jest.fn().mockResolvedValue([{ count: 0 }]) },
    );
    return sql;
  },
}));

// Mock UserRepository
jest.mock('../services/repositories/userRepository', () => ({
  UserRepository: {
    findByEmail: jest.fn(),
  },
}));

// Mock comparePassword
jest.mock('../services/auth/password', () => ({
  comparePassword: jest.fn(),
}));

// Mock rate limiter to always allow
jest.mock('../services/auth/rateLimiter', () => ({
  checkRateLimit: jest.fn().mockReturnValue({ allowed: true, remaining: 4, resetTime: 0 }),
  getClientIdentifier: jest.fn().mockReturnValue('127.0.0.1'),
}));

import { UserRepository } from '../services/repositories/userRepository';
import { comparePassword } from '../services/auth/password';
import authHandler from '../api/admin/auth';
import dashboardHandler from '../api/admin/dashboard';
import bulkHandler from '../api/admin/tips/bulk';
// We test [id].ts for tips by importing it directly
import tipIdHandler from '../api/admin/tips/[id]';

const adminToken = generateToken({ userId: 'admin-1', email: 'admin@test.com', isAdmin: true });
const userToken  = generateToken({ userId: 'user-1',  email: 'user@test.com' });

// ── POST /api/admin/auth ──────────────────────────────────────────────────────

describe('POST /api/admin/auth', () => {
  it('returns 400 when email or password missing', async () => {
    const req = mockReq({ method: 'POST', body: { email: 'admin@test.com' } });
    const res = mockRes();
    await authHandler(req as never, res as never);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 when user is not found', async () => {
    (UserRepository.findByEmail as jest.Mock).mockResolvedValueOnce(null);
    const req = mockReq({ method: 'POST', body: { email: 'x@x.com', password: 'pass' } });
    const res = mockRes();
    await authHandler(req as never, res as never);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
  });

  it('returns 401 when user is not an admin', async () => {
    (UserRepository.findByEmail as jest.Mock).mockResolvedValueOnce({
      id: 'u1', email: 'x@x.com', full_name: 'Test', is_admin: false, password_hash: 'hash',
    });
    const req = mockReq({ method: 'POST', body: { email: 'x@x.com', password: 'pass' } });
    const res = mockRes();
    await authHandler(req as never, res as never);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when password does not match', async () => {
    (UserRepository.findByEmail as jest.Mock).mockResolvedValueOnce({
      id: 'u1', email: 'admin@test.com', full_name: 'Admin', is_admin: true, password_hash: 'hash',
    });
    (comparePassword as jest.Mock).mockResolvedValueOnce(false);
    const req = mockReq({ method: 'POST', body: { email: 'admin@test.com', password: 'wrong' } });
    const res = mockRes();
    await authHandler(req as never, res as never);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 200 and token on valid admin credentials', async () => {
    (UserRepository.findByEmail as jest.Mock).mockResolvedValueOnce({
      id: 'admin-1', email: 'admin@test.com', full_name: 'Admin User', is_admin: true, password_hash: 'hash',
    });
    (comparePassword as jest.Mock).mockResolvedValueOnce(true);
    const req = mockReq({ method: 'POST', body: { email: 'admin@test.com', password: 'correct' } });
    const res = mockRes();
    await authHandler(req as never, res as never);
    expect(res.status).toHaveBeenCalledWith(200);
    const call = (res.json as jest.Mock).mock.calls[0][0];
    expect(call.success).toBe(true);
    expect(typeof call.token).toBe('string');
    expect(call.admin.email).toBe('admin@test.com');
  });
});

// ── GET /api/admin/dashboard ──────────────────────────────────────────────────

describe('GET /api/admin/dashboard', () => {
  it('returns 401 without auth header', async () => {
    const req = mockReq({ method: 'GET', headers: {} });
    const res = mockRes();
    await dashboardHandler(req as never, res as never);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 403 with non-admin token', async () => {
    const req = mockReq({ method: 'GET', headers: bearerHeader(userToken) });
    const res = mockRes();
    await dashboardHandler(req as never, res as never);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 200 with admin token', async () => {
    const { neon } = require('@neondatabase/serverless');
    const sql = neon();
    // Return counts for each parallel query
    (sql as jest.Mock).mockResolvedValue([{ count: 5 }]);
    const req = mockReq({ method: 'GET', headers: bearerHeader(adminToken) });
    const res = mockRes();
    await dashboardHandler(req as never, res as never);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ── POST /api/admin/tips/bulk ─────────────────────────────────────────────────

describe('POST /api/admin/tips/bulk', () => {
  it('returns 400 when ids is empty', async () => {
    const req = mockReq({ method: 'POST', headers: bearerHeader(adminToken), body: { ids: [], status: 'approved' } });
    const res = mockRes();
    await bulkHandler(req as never, res as never);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when ids has more than 100 items', async () => {
    const ids = Array.from({ length: 101 }, (_, i) => `id-${i}`);
    const req = mockReq({ method: 'POST', headers: bearerHeader(adminToken), body: { ids, status: 'approved' } });
    const res = mockRes();
    await bulkHandler(req as never, res as never);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('100') }));
  });

  it('returns 400 when ids contain non-UUID strings', async () => {
    const req = mockReq({ method: 'POST', headers: bearerHeader(adminToken), body: { ids: ['not-a-uuid'], status: 'approved' } });
    const res = mockRes();
    await bulkHandler(req as never, res as never);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'All ids must be valid UUIDs' });
  });

  it('returns 400 when status is invalid', async () => {
    const req = mockReq({
      method: 'POST',
      headers: bearerHeader(adminToken),
      body: { ids: ['00000000-0000-0000-0000-000000000001'], status: 'badstatus' },
    });
    const res = mockRes();
    await bulkHandler(req as never, res as never);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ── PUT /api/admin/tips/[id] ──────────────────────────────────────────────────

describe('PUT /api/admin/tips/[id]', () => {
  it('returns 400 on invalid status value', async () => {
    const req = mockReq({
      method: 'PUT',
      headers: bearerHeader(adminToken),
      query: { id: '00000000-0000-0000-0000-000000000001' },
      body: { status: 'notreal' },
    });
    const res = mockRes();
    await tipIdHandler(req as never, res as never);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid status' });
  });

  it('returns 400 on invalid severity value', async () => {
    const req = mockReq({
      method: 'PUT',
      headers: bearerHeader(adminToken),
      query: { id: '00000000-0000-0000-0000-000000000001' },
      body: { severity: 'extreme' },
    });
    const res = mockRes();
    await tipIdHandler(req as never, res as never);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid severity' });
  });

  it('returns 400 when no valid fields provided', async () => {
    const req = mockReq({
      method: 'PUT',
      headers: bearerHeader(adminToken),
      query: { id: '00000000-0000-0000-0000-000000000001' },
      body: {},
    });
    const res = mockRes();
    await tipIdHandler(req as never, res as never);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
