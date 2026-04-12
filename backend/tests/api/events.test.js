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

describe('Events API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/events', () => {
    it('should return a list of events', async () => {
      mockPool.promise().query.mockResolvedValueOnce([
        [{ event_id: 1, event_name: 'Food Drive' }]
      ]);

      const res = await request(app).get('/api/events');
      expect(res.statusCode).toEqual(200);
      expect(res.body[0].event_name).toBe('Food Drive');
    });
  });

  describe('POST /api/events', () => {
    it('should create an event', async () => {
      mockConnection.query
        .mockResolvedValueOnce([{ insertId: 1 }]) // Event insertion
        .mockResolvedValueOnce([{ insertId: 2 }]) // Location insertion
        .mockResolvedValueOnce([{ insertId: 3 }]); // Event_Location insertion

      const res = await request(app)
        .post('/api/events')
        .send({
          title: 'New Event',
          event_date: '2027-01-01',
          start_datetime: '2027-01-01 12:00:00',
          end_datetime: '2027-01-01 14:00:00',
          contact_email: 'test@example.com',
          street_address: '123 Main St',
          city: 'Atlanta',
          state: 'GA',
          zip: '30303',
          provider_id: 1,
          category_ids: [1],
          shifts: []
        });

      // API might return 201 or 200 based on implementation, usually 201
      expect(res.statusCode).toBeLessThan(300);
      expect(res.body.message).toMatch(/success/i);
    });
  });
});
