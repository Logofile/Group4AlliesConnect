const request = require('supertest');
const app = require('../../server');
const mysql = require('mysql2');

jest.mock('../../middleware/permissions', () => ({
  requireRole: (pool, role) => {
    return (req, res, next) => {
      req.currentUser = { user_id: 1, roles: [role] };
      next();
    };
  }
}));

const mockPool = mysql._mockPool;

describe('Admin API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── GET /api/admin/accounts ───────────────────────────────────────

  describe('GET /api/admin/accounts', () => {
    it('should return admin account list', async () => {
      mockPool.promise().query.mockResolvedValueOnce([
        [
          {
            user_id: 1,
            username: 'admin1',
            email: 'admin@example.com',
            name: 'Admin User',
            roles: 'admin',
            date_created: null,
            date_updated: null,
          },
        ],
      ]);

      const res = await request(app)
        .get('/api/admin/accounts')
        .set('x-user-id', '1');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body[0].email).toBe('admin@example.com');
      expect(res.body[0].roles).toBe('admin');
    });

    it('should handle internal server errors', async () => {
      mockPool.promise().query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app)
        .get('/api/admin/accounts')
        .set('x-user-id', '1');

      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toBe('Failed to fetch accounts');
    });
  });

  // ── DELETE /api/admin/accounts/:id ───────────────────────────────

  describe('DELETE /api/admin/accounts/:id', () => {
    it('should delete an account', async () => {
      mockPool.promise().query
        // DELETE User
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        // logAudit
        .mockResolvedValueOnce([{}]);

      const res = await request(app)
        .delete('/api/admin/accounts/2')
        .set('x-user-id', '1');

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Account deleted');
    });

    it('should prevent admin self-delete', async () => {
      const res = await request(app)
        .delete('/api/admin/accounts/1')
        .set('x-user-id', '1');

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toMatch(/cannot delete their own account/i);
    });

    it('should return 404 when account is not found', async () => {
      mockPool.promise().query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const res = await request(app)
        .delete('/api/admin/accounts/999')
        .set('x-user-id', '1');

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toBe('Account not found');
    });
  });

  // ── GET /api/admin/pending-providers ──────────────────────────────

  describe('GET /api/admin/pending-providers', () => {
    it('should return pending providers', async () => {
      mockPool.promise().query.mockResolvedValueOnce([
        [{ provider_id: 1, name: 'Test Org', status: 'pending' }]
      ]);

      const res = await request(app)
        .get('/api/admin/pending-providers')
        .set('x-user-id', '1');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body[0].name).toBe('Test Org');
      expect(mockPool.promise().query).toHaveBeenCalledTimes(1);
    });

    it('should handle internal server errors', async () => {
      mockPool.promise().query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app)
        .get('/api/admin/pending-providers')
        .set('x-user-id', '1');

      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toBe('Failed to fetch pending providers');
    });
  });

  // ── GET /api/admin/logs ───────────────────────────────────────────

  describe('GET /api/admin/logs', () => {
    it('should return admin logs', async () => {
      mockPool.promise().query.mockResolvedValueOnce([
        [{ log_id: 1, actor_user_id: 1, action: 'APPROVE_PROVIDER' }]
      ]);

      const res = await request(app)
        .get('/api/admin/logs')
        .set('x-user-id', '1');

      expect(res.statusCode).toEqual(200);
      expect(res.body[0].action).toBe('APPROVE_PROVIDER');
    });

    it('should handle internal server errors', async () => {
      mockPool.promise().query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app)
        .get('/api/admin/logs')
        .set('x-user-id', '1');

      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toBe('Failed to fetch audit logs');
    });
  });

  // ── PATCH /api/admin/providers/:id/status ─────────────────────────

  describe('PATCH /api/admin/providers/:id/status', () => {
    it('should update provider status', async () => {
      mockPool.promise().query
        // 1: UPDATE ServiceProvider
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        // 2: logAudit
        .mockResolvedValueOnce([{}]);

      const res = await request(app)
        .patch('/api/admin/providers/1/status')
        .set('x-user-id', '1')
        .send({ status: 'active' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toMatch(/updated/i);
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(app)
        .patch('/api/admin/providers/1/status')
        .set('x-user-id', '1')
        .send({ status: 'invalid' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toMatch(/invalid status/i);
    });
  });

  // ── PATCH /api/admin/providers/:id/approve ────────────────────────

  describe('PATCH /api/admin/providers/:id/approve', () => {
    it('should approve a provider', async () => {
      mockPool.promise().query
        // 1: UPDATE ServiceProvider
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        // 2: logAudit
        .mockResolvedValueOnce([{}]);

      const res = await request(app)
        .patch('/api/admin/providers/1/approve')
        .set('x-user-id', '1');

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toMatch(/approved/i);
    });
  });
});
