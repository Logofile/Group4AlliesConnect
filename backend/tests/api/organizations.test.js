const request = require('supertest');
const app = require('../../server');
const mysql = require('mysql2');

const mockPool = mysql._mockPool;

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword'),
  compare: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../middleware/permissions', () => ({
  requireRole: (pool, role) => {
    return (req, res, next) => {
      req.currentUser = { user_id: 1, roles: [role] };
      next();
    };
  }
}));

describe('Organizations API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── GET /api/organizations/profile/:id ────────────────────────────

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

  // ── POST /api/organizations/register ──────────────────────────────

  describe('POST /api/organizations/register', () => {
    it('should register a new organization', async () => {
      mockPool.promise().query
        // 1: Check existing email
        .mockResolvedValueOnce([[]])
        // 2: Check existing username
        .mockResolvedValueOnce([[]])
        // 3: INSERT User
        .mockResolvedValueOnce([{ insertId: 10 }])
        // 4: INSERT UserProfile
        .mockResolvedValueOnce([{ insertId: 11 }])
        // 5: INSERT ServiceProvider
        .mockResolvedValueOnce([{ insertId: 12 }])
        // 6: INSERT ServiceProviderClaim
        .mockResolvedValueOnce([{ insertId: 13 }])
        // 7: INSERT UserRole
        .mockResolvedValueOnce([{ insertId: 14 }])
        // 8: INSERT ServiceProviderUser
        .mockResolvedValueOnce([{ insertId: 15 }]);

      const res = await request(app)
        .post('/api/organizations/register')
        .send({
          organization_name: 'New Org',
          first_name: 'Org',
          last_name: 'Contact',
          email: 'org@example.com',
          phone_number: '5551234567',
          username: 'neworg',
          password: 'Password1!',
          zip_code: '30303',
          ein: '12-3456789'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toMatch(/registered successfully/i);
      expect(res.body.user_id).toBe(10);
      expect(res.body.provider_id).toBe(12);
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/organizations/register')
        .send({
          email: 'org@example.com',
          password: 'Password1!'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toMatch(/required/i);
    });

    it('should return 400 for duplicate email', async () => {
      // Check existing email returns a match
      mockPool.promise().query.mockResolvedValueOnce([[{ user_id: 1 }]]);

      const res = await request(app)
        .post('/api/organizations/register')
        .send({
          organization_name: 'New Org',
          first_name: 'Org',
          last_name: 'Contact',
          email: 'existing@example.com',
          phone_number: '5551234567',
          username: 'neworg',
          password: 'Password1!',
          zip_code: '30303',
          ein: '12-3456789'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toMatch(/already exists/i);
    });

    it('should return 400 for weak password', async () => {
      const res = await request(app)
        .post('/api/organizations/register')
        .send({
          organization_name: 'New Org',
          first_name: 'Org',
          last_name: 'Contact',
          email: 'org@example.com',
          phone_number: '5551234567',
          username: 'neworg',
          password: 'weak',
          zip_code: '30303',
          ein: '12-3456789'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toMatch(/Password must be/i);
    });

    it('should return 400 for invalid EIN format', async () => {
      const res = await request(app)
        .post('/api/organizations/register')
        .send({
          organization_name: 'New Org',
          first_name: 'Org',
          last_name: 'Contact',
          email: 'org@example.com',
          phone_number: '5551234567',
          username: 'neworg',
          password: 'Password1!',
          zip_code: '30303',
          ein: '123456789'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toMatch(/EIN/i);
    });
  });
});
