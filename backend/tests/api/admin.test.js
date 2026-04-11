const request = require('supertest');
const app = require('../../server');
const mysql = require('mysql2');

jest.mock('../../middleware/permissions', () => ({
  requireRole: (pool, role) => {
    return (req, res, next) => {
      req.user = { userId: 1, role: 'admin' };
      if (req.user && req.user.role === role) {
        next();
      } else {
        res.status(403).json({ message: 'Forbidden' });
      }
    };
  }
}));

const mockPool = mysql._mockPool;

describe('Admin API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/pending-providers', () => {
    it('should return pending providers', async () => {
      // Setup DB mock response
      mockPool.promise().query.mockResolvedValueOnce([
        [
          { provider_id: 1, user_id: 2, organization_name: 'Test Org' }
        ]
      ]);

      const res = await request(app).get('/api/admin/pending-providers');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body[0].organization_name).toBe('Test Org');
      expect(mockPool.promise().query).toHaveBeenCalledTimes(1);
    });

    it('should handle internal server errors', async () => {
      // Setup DB mock to throw
      mockPool.promise().query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).get('/api/admin/pending-providers');
      
      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toBe('Failed to fetch pending providers');
    });
  });

  describe('GET /api/admin/logs', () => {
    it('should return admin logs', async () => {
      mockPool.promise().query.mockResolvedValueOnce([
        [
          { log_id: 1, admin_id: 1, action: 'approved_provider' }
        ]
      ]);

      const res = await request(app).get('/api/admin/logs');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body[0].action).toBe('approved_provider');
    });
  });
});
