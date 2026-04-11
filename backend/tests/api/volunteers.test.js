const request = require('supertest');
const app = require('../../server');
const mysql = require('mysql2');

const mockPool = mysql._mockPool;
const mockConnection = mysql._mockConnection;

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

describe('Volunteers API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/volunteer-opportunities', () => {
    it('should list volunteer opportunities', async () => {
      mockPool.promise().query.mockResolvedValueOnce([
        [{ opportunity_id: 1, title: 'Clean up park' }]
      ]);

      const res = await request(app).get('/api/volunteer-opportunities');
      expect(res.statusCode).toEqual(200);
      expect(res.body[0].title).toBe('Clean up park');
    });
  });

  describe('POST /api/volunteer-signups', () => {
    it('should create a volunteer signup', async () => {
      mockPool.promise().query
        .mockResolvedValueOnce([[{ capacity: 10 }]]) // Validate capacity
        .mockResolvedValueOnce([[]]) // Check existing signup
        .mockResolvedValueOnce([{ insertId: 1 }]); // Insert signup

      const res = await request(app)
        .post('/api/volunteer-signups')
        .send({
          volunteerId: 1,
          shiftId: 1
        });

      expect(res.statusCode).toBeLessThan(300);
      expect(res.body.message).toMatch(/success/i);
    });
  describe('GET /api/volunteer-opportunities/:id', () => {
    it('should get an opportunity by id', async () => {
      mockPool.promise().query
        .mockResolvedValueOnce([[{ opportunity_id: 1, title: 'Clean up' }]])
        .mockResolvedValueOnce([[]]);
      const res = await request(app).get('/api/volunteer-opportunities/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body.title).toBe('Clean up');
    });
  });

  describe('PUT /api/volunteer-opportunities/:id', () => {
    it('should update an opportunity', async () => {
      mockConnection.query.mockResolvedValueOnce([{}]);
      const res = await request(app).put('/api/volunteer-opportunities/1').send({ title: 'Updated' });
      expect(res.statusCode).toBeLessThan(500);
    });
  });

  describe('DELETE /api/volunteer-opportunities/:id', () => {
    it('should delete an opportunity', async () => {
      mockPool.promise().query.mockResolvedValueOnce([{}]);
      const res = await request(app).delete('/api/volunteer-opportunities/1');
      expect(res.statusCode).toBeLessThan(500);
    });
  });
  });
});
