const request = require('supertest');
const app = require('../../server');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

const mockPool = mysql._mockPool;
const mockConnection = mysql._mockConnection;

// Mock bcrypt so tests don't spend time hashing
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword'),
  compare: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../middleware/permissions', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { userId: 1, role: 'volunteer' };
    next();
  },
  requireRole: (pool, role) => {
    return (req, res, next) => {
      req.user = { userId: 1, role };
      next();
    };
  }
}));

describe('Auth API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new volunteer user', async () => {
      // 1: Check existing users (0 rows)
      mockPool.promise().query.mockResolvedValueOnce([[]]);
      mockConnection.query
        // 2: Insert into User
        .mockResolvedValueOnce([{ insertId: 5 }])
        // 3: Insert role
        .mockResolvedValueOnce([{ insertId: 6 }])
        // 4: Insert into Volunteer
        .mockResolvedValueOnce([{ insertId: 7 }]);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          role: 'volunteer',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          username: 'johndoe',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.userId).toBe(5);
    });

    it('should reject registration if email is already in use', async () => {
      // 1: Check existing users (1 row)
      mockPool.promise().query.mockResolvedValueOnce([[{ user_id: 1 }]]);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          role: 'volunteer',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          username: 'johndoe',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Email or username is already in use');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully log in a user', async () => {
      mockPool.promise().query
        // 1: Find user
        .mockResolvedValueOnce([[{ user_id: 1, password_hash: 'hashedpassword', email: 'test@example.com' }]])
        // 2: Find roles
        .mockResolvedValueOnce([[{ role_name: 'volunteer' }]]);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'johndoe',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.role).toBe('volunteer');
      expect(res.body.token).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      bcrypt.compare.mockResolvedValueOnce(false);
      mockPool.promise().query.mockResolvedValueOnce([[{ user_id: 1, password_hash: 'wrong' }]]);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'johndoe',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Invalid credentials');
    });
  });

  describe('GET /api/users/profile/:id', () => {
    it('should get user profile', async () => {
      mockPool.promise().query.mockResolvedValueOnce([[{ first_name: 'John' }]]);
      const res = await request(app).get('/api/users/profile/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body.first_name).toBe('John');
    });
  });
});
