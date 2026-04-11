const request = require('supertest');
const app = require('../../server');
const mysql = require('mysql2');

const mockPool = mysql._mockPool;
const mockConnection = mysql._mockConnection;

jest.mock('../../middleware/permissions', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { userId: 1, role: 'provider' };
    next();
  },
  requireRole: (pool, role) => {
    return (req, res, next) => {
      req.user = { userId: 1, role };
      next();
    };
  }
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword'),
  compare: jest.fn().mockResolvedValue(true)
}));

describe('Organizations API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/organizations/profile/:id', () => {
    it('should return the provider profile details', async () => {
      mockPool.promise().query.mockResolvedValueOnce([
        [{ provider_id: 1, name: 'Test Provider', contact_name: 'Test Contact' }]
      ]);

      const res = await request(app).get('/api/organizations/profile/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toBe('Test Provider');
    });

    it('should return 404 if provider not found', async () => {
      mockPool.promise().query.mockResolvedValueOnce([[]]);
      const res = await request(app).get('/api/organizations/profile/99');
      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toMatch(/not found/i);
    });
  });

  describe('POST /api/organizations/register', () => {
    it('should register a new organization', async () => {
      // Setup successful creation
      mockPool.promise().query.mockResolvedValue([[]]); // Existing checks
      mockConnection.query
        .mockResolvedValueOnce([{ insertId: 10 }]) // User
        .mockResolvedValueOnce([{ insertId: 11 }]) // Role
        .mockResolvedValueOnce([{ insertId: 12 }]); // ServiceProvider

      const res = await request(app)
        .post('/api/organizations/register')
        .send({
          organizationName: 'New Org',
          contactName: 'Org Contact',
          email: 'org@example.com',
          phone: '1234567890',
          username: 'neworg',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toMatch(/registered successfully/i);
    });
  });
});
