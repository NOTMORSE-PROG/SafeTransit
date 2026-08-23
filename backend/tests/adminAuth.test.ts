import { generateToken } from '../services/auth/jwt';
import { requireAdminAuth } from '../services/auth/adminAuth';
import { mockReq, mockRes, bearerHeader } from './helpers';

describe('requireAdminAuth', () => {
  it('returns null and 401 when Authorization header is missing', () => {
    const req = mockReq({ headers: {} });
    const res = mockRes();
    const result = requireAdminAuth(req as never, res as never);
    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('returns null and 401 when Bearer prefix is missing', () => {
    const req = mockReq({ headers: { authorization: 'Token abc123' } });
    const res = mockRes();
    const result = requireAdminAuth(req as never, res as never);
    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns null and 401 when token is invalid/expired', () => {
    const req = mockReq({ headers: bearerHeader('not.a.valid.jwt') });
    const res = mockRes();
    const result = requireAdminAuth(req as never, res as never);
    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns null and 403 when token is valid but isAdmin is false', () => {
    const token = generateToken({ userId: 'user-1', email: 'user@test.com' });
    const req = mockReq({ headers: bearerHeader(token) });
    const res = mockRes();
    const result = requireAdminAuth(req as never, res as never);
    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: Admin access required' });
  });

  it('returns payload when token is valid and isAdmin is true', () => {
    const token = generateToken({ userId: 'admin-1', email: 'admin@test.com', isAdmin: true });
    const req = mockReq({ headers: bearerHeader(token) });
    const res = mockRes();
    const result = requireAdminAuth(req as never, res as never);
    expect(result).not.toBeNull();
    expect(result?.userId).toBe('admin-1');
    expect(result?.isAdmin).toBe(true);
    expect(res.status).not.toHaveBeenCalled();
  });
});
