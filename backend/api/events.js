const { logEmail } = require("../utils/logging");
const { geocodeAddress } = require("../utils/geocode");

module.exports = function (app, pool) {
  // GET /api/events
  // Optional filters: category, zip, date_from, date_to
  app.get("/api/events", async (req, res) => {
    try {
      const { category, zip, date_from, date_to } = req.query;

      let query = `
        SELECT 
          e.event_id,
          e.provider_id,
          e.category_id,
          e.location_id,
          e.title,
          e.event_date,
          e.start_datetime,
          e.end_datetime,
          e.description,
          e.capacity,
          e.registration_required,
          e.special_instructions,
          e.image_url,
          e.flyer_url,
          e.created_at,
          s.name AS provider_name,
          c.name AS category_name,
          l.street_address_1,
          l.street_address_2,
          l.city,
          l.state,
          l.zip,
          l.latitude,
          l.longitude
        FROM Event e
        JOIN ServiceProvider s ON e.provider_id = s.provider_id
        JOIN Category c ON e.category_id = c.category_id
        JOIN Location l ON e.location_id = l.location_id
        WHERE 1=1
      `;

      const params = [];

      if (category) {
        query += " AND c.name = ?";
        params.push(category);
      }

      if (zip) {
        query += " AND l.zip = ?";
        params.push(zip);
      }

      if (date_from) {
        query += " AND e.start_datetime >= ?";
        params.push(date_from);
      }

      if (date_to) {
        query += " AND e.start_datetime <= ?";
        params.push(date_to);
      }

      query += " ORDER BY e.start_datetime ASC";

      const [rows] = await pool.promise().query(query, params);
      res.json(rows);
    } catch (err) {
      console.error("Error fetching events:", err);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // GET /api/events/:id
  // Returns full event details
  app.get("/api/events/:id", async (req, res) => {
    try {
      const eventId = req.params.id;

      const query = `
        SELECT 
          e.event_id,
          e.provider_id,
          e.category_id,
          e.location_id,
          e.title,
          e.event_date,
          e.start_datetime,
          e.end_datetime,
          e.description,
          e.capacity,
          e.registration_required,
          e.special_instructions,
          e.image_url,
          e.flyer_url,
          e.created_at,
          s.name AS provider_name,
          s.website AS provider_website,
          s.contact_name,
          s.contact_email,
          s.contact_phone,
          c.name AS category_name,
          l.street_address_1,
          l.street_address_2,
          l.city,
          l.state,
          l.zip,
          l.latitude,
          l.longitude
        FROM Event e
        JOIN ServiceProvider s ON e.provider_id = s.provider_id
        JOIN Category c ON e.category_id = c.category_id
        JOIN Location l ON e.location_id = l.location_id
        WHERE e.event_id = ?
      `;

      const [rows] = await pool.promise().query(query, [eventId]);

      if (rows.length === 0) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json(rows[0]);
    } catch (err) {
      console.error("Error fetching event details:", err);
      res.status(500).json({ error: "Failed to fetch event details" });
    }
  });

  // POST /api/events
  // Body: { title, provider_id, street_address, city, state, zip, event_date, start_datetime, end_datetime, description, category_ids, shifts }
  app.post("/api/events", async (req, res) => {
    const conn = await pool.promise().getConnection();
    try {
      const {
        title,
        provider_id,
        street_address,
        city,
        state,
        zip,
        event_date,
        start_datetime,
        end_datetime,
        description,
        category_ids,
        shifts,
      } = req.body;

      if (
        !title ||
        !provider_id ||
        !street_address ||
        !city ||
        !state ||
        !zip ||
        !start_datetime ||
        !end_datetime ||
        !category_ids ||
        category_ids.length === 0
      ) {
        return res.status(400).json({ error: "Missing required fields." });
      }

      await conn.beginTransaction();

      // Geocode the address to get lat/lng
      const coords = await geocodeAddress({
        street: street_address,
        city,
        state,
        zip,
      });

      // Check if a Location with this lat/lng already exists
      let locationId;
      if (coords?.lat != null && coords?.lng != null) {
        const [existing] = await conn.query(
          `SELECT location_id FROM Location WHERE latitude = ? AND longitude = ?`,
          [coords.lat, coords.lng],
        );
        if (existing.length > 0) {
          locationId = existing[0].location_id;
        }
      }

      // Create a new Location if no match was found
      if (!locationId) {
        const [locResult] = await conn.query(
          `INSERT INTO Location (street_address_1, city, state, zip, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            street_address,
            city,
            state,
            zip,
            coords?.lat || null,
            coords?.lng || null,
          ],
        );
        locationId = locResult.insertId;
      }

      // Insert event (uses the first category_id)
      const categoryId = category_ids[0];
      const [eventResult] = await conn.query(
        `INSERT INTO Event (provider_id, category_id, location_id, title, event_date, start_datetime, end_datetime, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          provider_id,
          categoryId,
          locationId,
          title,
          event_date,
          start_datetime,
          end_datetime,
          description || null,
        ],
      );
      const eventId = eventResult.insertId;

      // If shifts are provided, create a VolunteerOpportunity and insert shifts
      if (Array.isArray(shifts) && shifts.length > 0) {
        const [oppResult] = await conn.query(
          `INSERT INTO VolunteerOpportunity (provider_id, location_id, event_id, title, status)
           VALUES (?, ?, ?, ?, 'open')`,
          [provider_id, locationId, eventId, `${title} - Volunteer Shifts`],
        );
        const opportunityId = oppResult.insertId;

        for (const shift of shifts) {
          await conn.query(
            `INSERT INTO VolunteerShift (opportunity_id, start_datetime, end_datetime, capacity)
             VALUES (?, ?, ?, ?)`,
            [opportunityId, shift.start_time, shift.end_time, 0],
          );
        }
      }

      await conn.commit();
      res
        .status(201)
        .json({ event_id: eventId, message: "Event created successfully." });
    } catch (err) {
      await conn.rollback();
      console.error("Error creating event:", err);
      res.status(500).json({ error: "Failed to create event." });
    } finally {
      conn.release();
    }
  });

  // PUT /api/events/:id
  // Updates event details
  app.put("/api/events/:id", async (req, res) => {
    try {
      const eventId = req.params.id;
      const {
        title,
        description,
        capacity,
        registration_required,
        special_instructions,
        start_datetime,
        end_datetime,
      } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Title is required." });
      }

      await pool.promise().query(
        `UPDATE Event
         SET title = ?, description = ?, capacity = ?, registration_required = ?,
             special_instructions = ?, start_datetime = ?, end_datetime = ?
         WHERE event_id = ?`,
        [
          title,
          description || null,
          capacity || null,
          registration_required || "unknown",
          special_instructions || null,
          start_datetime || null,
          end_datetime || null,
          eventId,
        ],
      );

      res.json({ message: "Event updated successfully." });
    } catch (err) {
      console.error("Error updating event:", err);
      res.status(500).json({ error: "Failed to update event." });
    }
  });

  // POST /api/events/:id/rsvp
  // Body: { userId, status }
  app.post("/api/events/:id/rsvp", async (req, res) => {
    try {
      const eventId = req.params.id;
      const { userId, status } = req.body;

      if (!userId || !status) {
        return res.status(400).json({
          error: "userId and status are required",
        });
      }

      if (!["yes", "no"].includes(status)) {
        return res.status(400).json({
          error: "status must be 'yes' or 'no'",
        });
      }

      const query = `
        INSERT INTO EventRSVP (event_id, user_id, status)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE status = VALUES(status)
      `;

      await pool.promise().query(query, [eventId, userId, status]);

      await logEmail(pool, userId, eventId, "event_confirmation", "sent");

      res.status(201).json({
        message: "RSVP recorded successfully",
      });
    } catch (err) {
      console.error("Error recording RSVP:", err);
      res.status(500).json({ error: "Failed to record RSVP" });
    }
  });
};
