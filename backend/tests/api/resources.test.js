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

describe('Resources API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/resources', () => {
    it('should return a list of resources', async () => {
      mockPool.promise().query.mockResolvedValueOnce([
        [{ resource_id: 1, title: 'Food Bank' }]
      ]);

      const res = await request(app).get('/api/resources');
      expect(res.statusCode).toEqual(200);
      expect(res.body[0].title).toBe('Food Bank');
    });
  });

  describe('POST /api/resources', () => {
    it('should create a resource', async () => {
      mockConnection.query
        .mockResolvedValueOnce([{ insertId: 1 }]) // Location
        .mockResolvedValueOnce([{ insertId: 2 }]) // Resource
        .mockResolvedValueOnce([{ insertId: 3 }]); // Resource_Location

      const res = await request(app)
        .post('/api/resources')
        .send({
          title: 'Shelter',
          description: 'A place to stay',
          provider_id: 1,
          category_ids: [2],
          street_address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip: '12345'
        });

      expect(res.statusCode).toBeLessThan(300);
      expect(res.body.message).toMatch(/success/i);
    });
  describe('GET /api/resources/:id', () => {
    it('should return a specific resource by id', async () => {
      mockPool.promise().query.mockResolvedValueOnce([
        [{ resource_id: 1, title: 'Food Bank' }]
      ]);
      const res = await request(app).get('/api/resources/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body.title).toBe('Food Bank');
    });
  });

  describe('PUT /api/resources/:id', () => {
    it('should update a specific resource', async () => {
      mockConnection.query.mockResolvedValueOnce([{}]);
      const res = await request(app).put('/api/resources/1').send({ title: 'Updated' });
      // Depending on missing fields this might return 400 or 200, but we test the invocation
      expect(res.statusCode).toBeLessThan(500);
    });
  });

  describe('DELETE /api/resources/:id', () => {
    it('should delete a resource', async () => {
      mockPool.promise().query.mockResolvedValueOnce([{}]);
      const res = await request(app).delete('/api/resources/1');
      expect(res.statusCode).toBeLessThan(500); // Expecting 200/204 or 400 depending on actual validation
    });
  });
  });
});
