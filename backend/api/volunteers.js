const { logAudit, logEmail } = require("../utils/logging");
const { requireRole } = require("../middleware/permissions");
const { rateLimit } = require("../middleware/rateLimit");
const { sendVolunteerScheduledEmail } = require("../utils/email");

module.exports = function (app, pool) {
  // GET /api/volunteer-opportunities
  app.get("/api/volunteer-opportunities", async (req, res) => {
    try {
      const { zip, provider_id, event_id, resource_id } = req.query;

      let query = `
        SELECT
          vo.opportunity_id,
          vo.provider_id,
          vo.location_id,
          vo.event_id,
          vo.resource_id,
          vo.title,
          vo.status,
          vo.contact_name,
          vo.contact_email,
          vo.contact_phone,
          vo.created_at,
          sp.name AS provider_name,
          l.street_address_1,
          l.street_address_2,
          l.city,
          l.state,
          l.zip
        FROM VolunteerOpportunity vo
        JOIN ServiceProvider sp ON vo.provider_id = sp.provider_id
        LEFT JOIN Location l ON vo.location_id = l.location_id
        WHERE 1=1`;
      const params = [];

      if (zip) {
        query += " AND l.zip = ?";
        params.push(zip);
      }

      if (provider_id) {
        query += " AND vo.provider_id = ?";
        params.push(provider_id);
      }

      if (event_id) {
        query += " AND vo.event_id = ?";
        params.push(event_id);
      }

      if (resource_id) {
        query += " AND vo.resource_id = ?";
        params.push(resource_id);
      }

      query += " ORDER BY vo.created_at DESC";

      const [rows] = await pool.promise().query(query, params);
      res.json(rows);
    } catch (err) {
      console.error("Error fetching volunteer opportunities:", err);
      res
        .status(500)
        .json({ error: "Failed to fetch volunteer opportunities" });
    }
  });

  // GET /api/volunteer-opportunities/:id
  app.get("/api/volunteer-opportunities/:id", async (req, res) => {
    try {
      const opportunityId = req.params.id;

      const [opportunityRows] = await pool.promise().query(
        `
        SELECT
          vo.opportunity_id,
          vo.provider_id,
          vo.location_id,
          vo.event_id,
          vo.resource_id,
          vo.title,
          vo.status,
          vo.contact_name,
          vo.contact_email,
          vo.contact_phone,
          vo.created_at,
          sp.name AS provider_name,
          l.street_address_1,
          l.street_address_2,
          l.city,
          l.state,
          l.zip
        FROM VolunteerOpportunity vo
        JOIN ServiceProvider sp ON vo.provider_id = sp.provider_id
        LEFT JOIN Location l ON vo.location_id = l.location_id
        WHERE vo.opportunity_id = ?
        `,
        [opportunityId],
      );

      if (opportunityRows.length === 0) {
        return res
          .status(404)
          .json({ error: "Volunteer opportunity not found" });
      }

      const [shiftRows] = await pool.promise().query(
        `
        SELECT
          shift_id,
          opportunity_id,
          start_datetime,
          end_datetime,
          capacity
        FROM VolunteerShift
        WHERE opportunity_id = ?
        ORDER BY start_datetime ASC
        `,
        [opportunityId],
      );

      res.json({
        ...opportunityRows[0],
        shifts: shiftRows,
      });
    } catch (err) {
      console.error("Error fetching volunteer opportunity details:", err);
      res
        .status(500)
        .json({ error: "Failed to fetch volunteer opportunity details" });
    }
  });

  // GET /api/users/:id/volunteer-signups
  app.get("/api/users/:id/volunteer-signups", async (req, res) => {
    try {
      const userId = req.params.id;

      const [rows] = await pool.promise().query(
        `
        SELECT
          s.signup_id,
          s.status,
          vo.opportunity_id,
          vo.event_id,
          vo.title,
          vs.shift_id,
          vs.start_datetime,
          vs.end_datetime,
          sp.name AS provider_name
        FROM VolunteerSignup s
        JOIN VolunteerShift vs ON s.shift_id = vs.shift_id
        JOIN VolunteerOpportunity vo ON vs.opportunity_id = vo.opportunity_id
        JOIN ServiceProvider sp ON vo.provider_id = sp.provider_id
        WHERE s.user_id = ?
          AND s.status = 'registered'
        ORDER BY vs.start_datetime ASC
        `,
        [userId],
      );

      res.json(rows);
    } catch (err) {
      console.error("Error fetching volunteer dashboard signups:", err);
      res.status(500).json({ error: "Failed to fetch volunteer signups" });
    }
  });

  // GET /api/users/:id/volunteer-hours/export
  app.get("/api/users/:id/volunteer-hours/export", async (req, res) => {
    try {
      const userId = req.params.id;

      const [rows] = await pool.promise().query(
        `
        SELECT
          vo.title,
          sp.name AS provider_name,
          vs.start_datetime,
          vs.end_datetime,
          TIMESTAMPDIFF(MINUTE, vs.start_datetime, vs.end_datetime) / 60 AS hours_worked
        FROM VolunteerSignup s
        JOIN VolunteerShift vs ON s.shift_id = vs.shift_id
        JOIN VolunteerOpportunity vo ON vs.opportunity_id = vo.opportunity_id
        JOIN ServiceProvider sp ON vo.provider_id = sp.provider_id
        WHERE s.user_id = ?
          AND s.status = 'registered'
          AND vs.end_datetime < NOW()
        ORDER BY vs.start_datetime ASC
        `,
        [userId],
      );

      let csv = "Opportunity,Provider,Start Time,End Time,Hours Worked\n";

      rows.forEach((row) => {
        const line = [
          `"${row.title || ""}"`,
          `"${row.provider_name || ""}"`,
          `"${row.start_datetime || ""}"`,
          `"${row.end_datetime || ""}"`,
          `"${row.hours_worked || 0}"`,
        ].join(",");

        csv += line + "\n";
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="volunteer-hours-user-${userId}.csv"`,
      );

      res.send(csv);
    } catch (err) {
      console.error("Error exporting volunteer hours:", err);
      res.status(500).json({ error: "Failed to export volunteer hours" });
    }
  });

  // GET /api/volunteers/:userId/event-signups
  // Returns only event-linked volunteer signups for a user
  app.get("/api/volunteers/:userId/event-signups", async (req, res) => {
    try {
      const userId = req.params.userId;

      const [rows] = await pool.promise().query(
        `
        SELECT DISTINCT
          vo.opportunity_id,
          vo.title AS opportunity_title,
          e.event_id,
          e.title,
          e.start_datetime,
          e.end_datetime,
          e.description,
          e.capacity,
          e.registration_required,
          e.image_url,
          e.flyer_url,
          e.special_instructions,
          c.name AS category_name,
          sp.name AS provider_name,
          l.street_address_1,
          l.street_address_2,
          l.city,
          l.state,
          l.zip,
          l.latitude,
          l.longitude,
          CASE
            WHEN e.end_datetime < NOW() THEN 'past'
            ELSE 'upcoming'
          END AS event_status
        FROM VolunteerSignup s
        JOIN VolunteerShift vs ON s.shift_id = vs.shift_id
        JOIN VolunteerOpportunity vo ON vs.opportunity_id = vo.opportunity_id
        JOIN Event e ON vo.event_id = e.event_id
        JOIN ServiceProvider sp ON vo.provider_id = sp.provider_id
        LEFT JOIN Category c ON e.category_id = c.category_id
        LEFT JOIN Location l ON e.location_id = l.location_id
        WHERE s.user_id = ?
          AND s.status = 'registered'
        ORDER BY e.start_datetime DESC
        `,
        [userId],
      );

      res.json(rows);
    } catch (err) {
      console.error("Error fetching volunteer event signups:", err);
      res.status(500).json({ error: "Failed to fetch event signups" });
    }
  });

  // GET /api/volunteers/:userId/resource-shifts
  // Returns resource-linked volunteer shifts for a user
  app.get("/api/volunteers/:userId/resource-shifts", async (req, res) => {
    try {
      const userId = req.params.userId;

      const [rows] = await pool.promise().query(
        `
        SELECT
          vs.shift_id,
          vs.start_datetime AS shift_start,
          vs.end_datetime AS shift_end,
          DATE(vs.start_datetime) AS shift_date,
          r.resource_id,
          r.name AS resource_name,
          sp.name AS provider_name,
          l.city,
          l.state,
          CASE
            WHEN vs.end_datetime < NOW() THEN 'past'
            ELSE 'upcoming'
          END AS shift_status
        FROM VolunteerSignup s
        JOIN VolunteerShift vs ON s.shift_id = vs.shift_id
        JOIN VolunteerOpportunity vo ON vs.opportunity_id = vo.opportunity_id
        JOIN Resource r ON vo.resource_id = r.resource_id
        JOIN ServiceProvider sp ON vo.provider_id = sp.provider_id
        LEFT JOIN Location l ON r.location_id = l.location_id
        WHERE s.user_id = ?
          AND s.status = 'registered'
          AND vo.event_id IS NULL
        ORDER BY vs.start_datetime DESC
        `,
        [userId],
      );

      res.json(rows);
    } catch (err) {
      console.error("Error fetching volunteer resource shifts:", err);
      res.status(500).json({ error: "Failed to fetch resource shifts" });
    }
  });

  // GET /api/volunteers/:userId/hours
  // Returns completed volunteer shift data for a user.
  // Optional query params: resource_id, date_from, date_to
  app.get("/api/volunteers/:userId/hours", async (req, res) => {
    try {
      const userId = req.params.userId;
      const { resource_id, date_from, date_to } = req.query;

      let query = `
        SELECT
          vs.shift_id,
          vs.start_datetime,
          vs.end_datetime,
          ROUND(TIMESTAMPDIFF(MINUTE, vs.start_datetime, vs.end_datetime) / 60, 2) AS hours_worked,
          DATE(vs.start_datetime) AS shift_date,
          r.name AS resource_name,
          r.resource_id,
          vo.title AS opportunity_title,
          sp.name AS provider_name
        FROM VolunteerSignup s
        JOIN VolunteerShift vs ON s.shift_id = vs.shift_id
        JOIN VolunteerOpportunity vo ON vs.opportunity_id = vo.opportunity_id
        JOIN ServiceProvider sp ON vo.provider_id = sp.provider_id
        LEFT JOIN Resource r ON vo.resource_id = r.resource_id
        WHERE s.user_id = ?
          AND s.status = 'registered'
          AND vs.end_datetime < NOW()
      `;
      const params = [userId];

      if (resource_id) {
        query += " AND vo.resource_id = ?";
        params.push(resource_id);
      }
      if (date_from) {
        query += " AND DATE(vs.start_datetime) >= ?";
        params.push(date_from);
      }
      if (date_to) {
        query += " AND DATE(vs.start_datetime) <= ?";
        params.push(date_to);
      }

      query += " ORDER BY vs.start_datetime ASC";

      const [rows] = await pool.promise().query(query, params);
      res.json(rows);
    } catch (err) {
      console.error("Error fetching volunteer hours:", err);
      res.status(500).json({ error: "Failed to fetch volunteer hours" });
    }
  });

  // GET /api/volunteers/:userId/resources
  // Returns only resources where the user has completed volunteer hours
  app.get("/api/volunteers/:userId/resources", async (req, res) => {
    try {
      const userId = req.params.userId;

      const [rows] = await pool.promise().query(
        `SELECT DISTINCT r.resource_id, r.name
         FROM VolunteerSignup s
         JOIN VolunteerShift vs ON s.shift_id = vs.shift_id
         JOIN VolunteerOpportunity vo ON vs.opportunity_id = vo.opportunity_id
         JOIN Resource r ON vo.resource_id = r.resource_id
         WHERE s.user_id = ?
           AND s.status = 'registered'
           AND vs.end_datetime < NOW()
         ORDER BY r.name ASC`,
        [userId],
      );

      res.json(rows);
    } catch (err) {
      console.error("Error fetching volunteer resources:", err);
      res.status(500).json({ error: "Failed to fetch volunteer resources" });
    }
  });

  // GET /api/events/:id/volunteer-signups/count
  app.get("/api/events/:id/volunteer-signups/count", async (req, res) => {
    try {
      const eventId = req.params.id;

      const [rows] = await pool.promise().query(
        `
        SELECT COUNT(*) AS volunteer_count
        FROM VolunteerSignup s
        JOIN VolunteerShift vs ON s.shift_id = vs.shift_id
        JOIN VolunteerOpportunity vo ON vs.opportunity_id = vo.opportunity_id
        WHERE vo.event_id = ?
          AND s.status = 'registered'
        `,
        [eventId],
      );

      res.json({
        event_id: Number(eventId),
        volunteer_count: rows[0].volunteer_count,
      });
    } catch (err) {
      console.error("Error fetching volunteer signup count for event:", err);
      res.status(500).json({ error: "Failed to fetch volunteer signup count" });
    }
  });

  // GET /api/events/:eventId/shifts
  // Returns all shifts linked to an event (through VolunteerOpportunity) with signup counts
  app.get("/api/events/:eventId/shifts", async (req, res) => {
    try {
      const eventId = req.params.eventId;

      const [rows] = await pool.promise().query(
        `SELECT
          vs.shift_id,
          vs.start_datetime,
          vs.end_datetime,
          vs.capacity,
          vo.opportunity_id,
          vo.title AS opportunity_title,
          COUNT(s.signup_id) AS signup_count
        FROM VolunteerShift vs
        JOIN VolunteerOpportunity vo ON vs.opportunity_id = vo.opportunity_id
        LEFT JOIN VolunteerSignup s ON vs.shift_id = s.shift_id AND s.status = 'registered'
        WHERE vo.event_id = ?
        GROUP BY vs.shift_id
        ORDER BY vs.start_datetime ASC`,
        [eventId],
      );

      res.json(rows);
    } catch (err) {
      console.error("Error fetching shifts for event:", err);
      res.status(500).json({ error: "Failed to fetch shifts for event" });
    }
  });

  // GET /api/events/:eventId/user-signups/:userId
  // Returns the user's active signups for a specific event
  app.get("/api/events/:eventId/user-signups/:userId", async (req, res) => {
    try {
      const { eventId, userId } = req.params;

      const [rows] = await pool.promise().query(
        `SELECT
          s.signup_id,
          s.status,
          vs.shift_id,
          vs.start_datetime,
          vs.end_datetime,
          vo.title AS opportunity_title
        FROM VolunteerSignup s
        JOIN VolunteerShift vs ON s.shift_id = vs.shift_id
        JOIN VolunteerOpportunity vo ON vs.opportunity_id = vo.opportunity_id
        WHERE s.user_id = ?
          AND vo.event_id = ?
          AND s.status = 'registered'
        ORDER BY vs.start_datetime ASC`,
        [userId, eventId],
      );

      res.json(rows);
    } catch (err) {
      console.error("Error fetching user signups for event:", err);
      res.status(500).json({ error: "Failed to fetch user signups for event" });
    }
  });

  // POST /api/events/:eventId/shifts
  // Add a new shift to an existing event. Creates a VolunteerOpportunity if none exists.
  app.post("/api/events/:eventId/shifts", rateLimit(), async (req, res) => {
    const conn = await pool.promise().getConnection();
    try {
      const eventId = req.params.eventId;
      const { start_datetime, end_datetime, capacity } = req.body;

      if (!start_datetime || !end_datetime) {
        return res.status(400).json({
          error: "start_datetime and end_datetime are required",
        });
      }

      await conn.beginTransaction();

      // Find existing VolunteerOpportunity for this event
      const [oppRows] = await conn.query(
        "SELECT opportunity_id FROM VolunteerOpportunity WHERE event_id = ? LIMIT 1",
        [eventId],
      );

      let opportunityId;
      if (oppRows.length > 0) {
        opportunityId = oppRows[0].opportunity_id;
      } else {
        // Need to look up provider_id and location_id from the event
        const [eventRows] = await conn.query(
          "SELECT provider_id, location_id, title FROM Event WHERE event_id = ?",
          [eventId],
        );
        if (eventRows.length === 0) {
          await conn.rollback();
          return res.status(404).json({ error: "Event not found" });
        }
        const ev = eventRows[0];
        const [oppResult] = await conn.query(
          `INSERT INTO VolunteerOpportunity (provider_id, location_id, event_id, title, status)
           VALUES (?, ?, ?, ?, 'open')`,
          [
            ev.provider_id,
            ev.location_id,
            eventId,
            `${ev.title} - Volunteer Shifts`,
          ],
        );
        opportunityId = oppResult.insertId;
      }

      const [result] = await conn.query(
        `INSERT INTO VolunteerShift (opportunity_id, start_datetime, end_datetime, capacity)
         VALUES (?, ?, ?, ?)`,
        [
          opportunityId,
          start_datetime,
          end_datetime,
          capacity != null && capacity !== "" ? capacity : 0,
        ],
      );

      await conn.commit();
      res.status(201).json({
        shift_id: result.insertId,
        message: "Shift added successfully",
      });
    } catch (err) {
      await conn.rollback();
      console.error("Error adding shift:", err);
      res.status(500).json({ error: "Failed to add shift" });
    } finally {
      conn.release();
    }
  });

  // PUT /api/shifts/:id
  // Update an existing shift's times and capacity
  app.put("/api/shifts/:id", rateLimit(), async (req, res) => {
    try {
      const shiftId = req.params.id;
      const { start_datetime, end_datetime, capacity } = req.body;

      if (!start_datetime || !end_datetime) {
        return res.status(400).json({
          error: "start_datetime and end_datetime are required",
        });
      }

      const [result] = await pool.promise().query(
        `UPDATE VolunteerShift
         SET start_datetime = ?, end_datetime = ?, capacity = ?
         WHERE shift_id = ?`,
        [
          start_datetime,
          end_datetime,
          capacity != null && capacity !== "" ? capacity : 0,
          shiftId,
        ],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Shift not found" });
      }

      res.json({ message: "Shift updated successfully" });
    } catch (err) {
      console.error("Error updating shift:", err);
      res.status(500).json({ error: "Failed to update shift" });
    }
  });

  // DELETE /api/shifts/:id
  // Remove a shift (cascades to signups)
  app.delete("/api/shifts/:id", async (req, res) => {
    try {
      const shiftId = req.params.id;

      const [result] = await pool
        .promise()
        .query("DELETE FROM VolunteerShift WHERE shift_id = ?", [shiftId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Shift not found" });
      }

      res.json({ message: "Shift deleted successfully" });
    } catch (err) {
      console.error("Error deleting shift:", err);
      res.status(500).json({ error: "Failed to delete shift" });
    }
  });

  // POST /api/volunteer-signups
  app.post("/api/volunteer-signups", rateLimit(), async (req, res) => {
    try {
      const { shift_id, user_id, scheduled_by_provider } = req.body;

      if (!shift_id || !user_id) {
        return res.status(400).json({
          error: "shift_id and user_id are required",
        });
      }

      const [shiftRows] = await pool.promise().query(
        `
        SELECT vs.shift_id, vo.event_id
        FROM VolunteerShift vs
        JOIN VolunteerOpportunity vo ON vs.opportunity_id = vo.opportunity_id
        WHERE vs.shift_id = ?
        `,
        [shift_id],
      );

      if (shiftRows.length === 0) {
        return res.status(404).json({ error: "Shift not found" });
      }

      // Check for an existing active signup for this specific shift
      const [activeRows] = await pool
        .promise()
        .query(
          "SELECT signup_id FROM VolunteerSignup WHERE shift_id = ? AND user_id = ? AND status = 'registered'",
          [shift_id, user_id],
        );

      if (activeRows.length > 0) {
        return res.status(400).json({
          error: "You are already signed up for this shift",
        });
      }

      // Check capacity before allowing signup
      const [capacityRows] = await pool.promise().query(
        `SELECT vs.capacity,
                COUNT(vsu.signup_id) AS signup_count
         FROM VolunteerShift vs
         LEFT JOIN VolunteerSignup vsu
           ON vsu.shift_id = vs.shift_id AND vsu.status = 'registered'
         WHERE vs.shift_id = ?
         GROUP BY vs.shift_id`,
        [shift_id],
      );

      if (
        capacityRows.length > 0 &&
        capacityRows[0].capacity != null &&
        capacityRows[0].capacity > 0 &&
        capacityRows[0].signup_count >= capacityRows[0].capacity
      ) {
        return res.status(400).json({
          error: "This shift is full. No more spots available.",
        });
      }

      // Check for a previously cancelled signup for the same shift
      const [cancelledRows] = await pool
        .promise()
        .query(
          "SELECT signup_id FROM VolunteerSignup WHERE shift_id = ? AND user_id = ? AND status = 'cancelled'",
          [shift_id, user_id],
        );

      let signupId;

      if (cancelledRows.length > 0) {
        // Reactivate the existing cancelled signup
        signupId = cancelledRows[0].signup_id;
        await pool
          .promise()
          .query(
            "UPDATE VolunteerSignup SET status = 'registered' WHERE signup_id = ?",
            [signupId],
          );
      } else {
        const [result] = await pool.promise().query(
          `INSERT INTO VolunteerSignup (shift_id, user_id, status)
           VALUES (?, ?, 'registered')`,
          [shift_id, user_id],
        );
        signupId = result.insertId;
      }

      await logEmail(pool, user_id, null, "volunteer_confirmation", "sent");

      if (scheduled_by_provider) {
        try {
          const [assignmentRows] = await pool.promise().query(
            `SELECT
              u.email,
              up.first_name,
              vo.title AS opportunity_title,
              sp.name AS provider_name,
              vs.start_datetime,
              vs.end_datetime
            FROM VolunteerShift vs
            JOIN VolunteerOpportunity vo ON vs.opportunity_id = vo.opportunity_id
            JOIN ServiceProvider sp ON vo.provider_id = sp.provider_id
            JOIN \`User\` u ON u.user_id = ?
            LEFT JOIN UserProfile up ON up.user_id = u.user_id
            WHERE vs.shift_id = ?
            LIMIT 1`,
            [user_id, shift_id],
          );

          const details = assignmentRows[0];
          if (details?.email) {
            await sendVolunteerScheduledEmail({
              to: details.email,
              firstName: details.first_name,
              opportunityTitle: details.opportunity_title,
              providerName: details.provider_name,
              startDatetime: details.start_datetime,
              endDatetime: details.end_datetime,
            });
          }
        } catch (emailErr) {
          console.error("Failed to send scheduled shift email:", emailErr);
        }
      }

      res.status(201).json({
        message: "Volunteer signup created successfully",
        signup_id: signupId,
      });
    } catch (err) {
      console.error("Error creating volunteer signup:", err);
      res.status(500).json({ error: "Failed to create volunteer signup" });
    }
  });

  // DELETE /api/volunteer-signups/:id
  app.delete("/api/volunteer-signups/:id", async (req, res) => {
    try {
      const signupId = req.params.id;

      await pool
        .promise()
        .query(
          "UPDATE VolunteerSignup SET status = 'cancelled' WHERE signup_id = ?",
          [signupId],
        );

      res.json({ message: "Volunteer signup cancelled successfully" });
    } catch (err) {
      console.error("Error cancelling volunteer signup:", err);
      res.status(500).json({ error: "Failed to cancel volunteer signup" });
    }
  });

  // POST /api/volunteer-opportunities
  app.post(
    "/api/volunteer-opportunities",
    rateLimit(),
    requireRole(pool, "provider"),
    async (req, res) => {
      try {
        const {
          provider_id,
          location_id,
          event_id,
          resource_id,
          title,
          status,
          contact_name,
          contact_email,
          contact_phone,
        } = req.body;

        if (!provider_id || !title) {
          return res.status(400).json({
            error: "provider_id and title are required",
          });
        }

        const [result] = await pool.promise().query(
          `
        INSERT INTO VolunteerOpportunity
        (provider_id, location_id, event_id, resource_id, title, status, contact_name, contact_email, contact_phone, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `,
          [
            provider_id,
            location_id || null,
            event_id || null,
            resource_id || null,
            title,
            status || "open",
            contact_name || null,
            contact_email || null,
            contact_phone || null,
          ],
        );

        await logAudit(
          pool,
          1,
          "CREATE_VOLUNTEER_OPPORTUNITY",
          "VolunteerOpportunity",
          result.insertId,
        );

        res.status(201).json({
          message: "Volunteer opportunity created successfully",
          opportunity_id: result.insertId,
        });
      } catch (err) {
        console.error("Error creating volunteer opportunity:", err);
        res
          .status(500)
          .json({ error: "Failed to create volunteer opportunity" });
      }
    },
  );

  // PUT /api/volunteer-opportunities/:id
  app.put(
    "/api/volunteer-opportunities/:id",
    rateLimit(),
    requireRole(pool, "provider"),
    async (req, res) => {
      try {
        const opportunityId = req.params.id;

        const {
          location_id,
          event_id,
          resource_id,
          title,
          status,
          contact_name,
          contact_email,
          contact_phone,
        } = req.body;

        await pool.promise().query(
          `
        UPDATE VolunteerOpportunity
        SET location_id = ?, event_id = ?, resource_id = ?, title = ?, status = ?, contact_name = ?, contact_email = ?, contact_phone = ?
        WHERE opportunity_id = ?
        `,
          [
            location_id || null,
            event_id || null,
            resource_id || null,
            title,
            status,
            contact_name || null,
            contact_email || null,
            contact_phone || null,
            opportunityId,
          ],
        );

        await logAudit(
          pool,
          1,
          "UPDATE_VOLUNTEER_OPPORTUNITY",
          "VolunteerOpportunity",
          opportunityId,
        );

        res.json({ message: "Volunteer opportunity updated successfully" });
      } catch (err) {
        console.error("Error updating volunteer opportunity:", err);
        res
          .status(500)
          .json({ error: "Failed to update volunteer opportunity" });
      }
    },
  );

  // DELETE /api/volunteer-opportunities/:id
  app.delete(
    "/api/volunteer-opportunities/:id",
    requireRole(pool, "provider"),
    async (req, res) => {
      try {
        const opportunityId = req.params.id;

        await pool
          .promise()
          .query("DELETE FROM VolunteerOpportunity WHERE opportunity_id = ?", [
            opportunityId,
          ]);

        await logAudit(
          pool,
          1,
          "DELETE_VOLUNTEER_OPPORTUNITY",
          "VolunteerOpportunity",
          opportunityId,
        );

        res.json({ message: "Volunteer opportunity deleted successfully" });
      } catch (err) {
        console.error("Error deleting volunteer opportunity:", err);
        res
          .status(500)
          .json({ error: "Failed to delete volunteer opportunity" });
      }
    },
  );

  // ── Volunteer ↔ Resource Connections ──────────────────────────────

  // GET /api/resource-connections?resource_id=&user_id=
  app.get("/api/resource-connections", async (req, res) => {
    try {
      const { resource_id, user_id } = req.query;

      if (!resource_id || !user_id) {
        return res
          .status(400)
          .json({ error: "resource_id and user_id are required" });
      }

      const [rows] = await pool
        .promise()
        .query(
          "SELECT * FROM VolunteerResourceConnection WHERE resource_id = ? AND user_id = ?",
          [resource_id, user_id],
        );

      res.json(rows.length > 0 ? rows[0] : null);
    } catch (err) {
      console.error("Error fetching resource connection:", err);
      res.status(500).json({ error: "Failed to fetch resource connection" });
    }
  });

  // POST /api/resource-connections
  // Creates a new connection or reactivates an inactive one.
  // Returns { already_active: true } when the volunteer is already connected.
  app.post("/api/resource-connections", rateLimit(), async (req, res) => {
    try {
      const { resource_id, user_id } = req.body;

      if (!resource_id || !user_id) {
        return res
          .status(400)
          .json({ error: "resource_id and user_id are required" });
      }

      const [rows] = await pool
        .promise()
        .query(
          "SELECT * FROM VolunteerResourceConnection WHERE resource_id = ? AND user_id = ?",
          [resource_id, user_id],
        );

      // No existing row → insert
      if (rows.length === 0) {
        const [result] = await pool.promise().query(
          `INSERT INTO VolunteerResourceConnection (resource_id, user_id, active, date_changed)
           VALUES (?, ?, TRUE, CURRENT_TIMESTAMP)`,
          [resource_id, user_id],
        );

        await logAudit(
          pool,
          user_id,
          "CONNECT_RESOURCE",
          "VolunteerResourceConnection",
          result.insertId,
        );

        return res
          .status(201)
          .json({ connection_id: result.insertId, created: true });
      }

      const existing = rows[0];

      // Row exists but inactive → reactivate
      if (!existing.active) {
        await pool
          .promise()
          .query(
            "UPDATE VolunteerResourceConnection SET active = TRUE, date_changed = CURRENT_TIMESTAMP WHERE connection_id = ?",
            [existing.connection_id],
          );

        await logAudit(
          pool,
          user_id,
          "ACTIVATE_RESOURCE_CONNECTION",
          "VolunteerResourceConnection",
          existing.connection_id,
        );

        return res.json({
          connection_id: existing.connection_id,
          activated: true,
        });
      }

      // Already active
      return res.json({
        connection_id: existing.connection_id,
        already_active: true,
      });
    } catch (err) {
      console.error("Error creating/updating resource connection:", err);
      res
        .status(500)
        .json({ error: "Failed to create/update resource connection" });
    }
  });

  // GET /api/users/:id/resource-connections
  // Returns all resource connections for a volunteer, with resource & provider info
  app.get("/api/users/:id/resource-connections", async (req, res) => {
    try {
      const userId = req.params.id;

      const [rows] = await pool.promise().query(
        `SELECT
           vrc.connection_id,
           vrc.resource_id,
           vrc.active,
           vrc.date_changed,
           r.name AS resource_name,
           sp.name AS provider_name,
           sp.contact_email,
           sp.contact_phone
         FROM VolunteerResourceConnection vrc
         JOIN Resource r ON vrc.resource_id = r.resource_id
         JOIN ServiceProvider sp ON r.provider_id = sp.provider_id
         WHERE vrc.user_id = ?
         ORDER BY vrc.date_changed DESC`,
        [userId],
      );

      res.json(rows);
    } catch (err) {
      console.error("Error fetching user resource connections:", err);
      res
        .status(500)
        .json({ error: "Failed to fetch user resource connections" });
    }
  });

  // PUT /api/resource-connections/:id/activate
  app.put(
    "/api/resource-connections/:id/activate",
    rateLimit(),
    async (req, res) => {
      try {
        const connectionId = req.params.id;

        await pool
          .promise()
          .query(
            "UPDATE VolunteerResourceConnection SET active = TRUE, date_changed = CURRENT_TIMESTAMP WHERE connection_id = ?",
            [connectionId],
          );

        await logAudit(
          pool,
          null,
          "ACTIVATE_RESOURCE_CONNECTION",
          "VolunteerResourceConnection",
          connectionId,
        );

        res.json({ connection_id: Number(connectionId), activated: true });
      } catch (err) {
        console.error("Error activating resource connection:", err);
        res
          .status(500)
          .json({ error: "Failed to activate resource connection" });
      }
    },
  );

  // PUT /api/resource-connections/:id/deactivate
  app.put(
    "/api/resource-connections/:id/deactivate",
    rateLimit(),
    async (req, res) => {
      try {
        const connectionId = req.params.id;

        await pool
          .promise()
          .query(
            "UPDATE VolunteerResourceConnection SET active = FALSE, date_changed = CURRENT_TIMESTAMP WHERE connection_id = ?",
            [connectionId],
          );

        await logAudit(
          pool,
          null,
          "DEACTIVATE_RESOURCE_CONNECTION",
          "VolunteerResourceConnection",
          connectionId,
        );

        res.json({ connection_id: Number(connectionId), deactivated: true });
      } catch (err) {
        console.error("Error deactivating resource connection:", err);
        res
          .status(500)
          .json({ error: "Failed to deactivate resource connection" });
      }
    },
  );

  // ─── Volunteer Weekly Availability ───────────────────────────────────

  // GET /api/volunteers/:userId/availability
  app.get("/api/volunteers/:userId/availability", async (req, res) => {
    try {
      const userId = req.params.userId;
      const [rows] = await pool
        .promise()
        .query(
          "SELECT * FROM VolunteerAvailability WHERE user_id = ? ORDER BY FIELD(day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')",
          [userId],
        );
      res.json(rows);
    } catch (err) {
      console.error("Error fetching availability:", err);
      res.status(500).json({ error: "Failed to fetch availability" });
    }
  });

  // PUT /api/volunteers/:userId/availability
  // Body: { schedule: [{ day_of_week, available, start_time, end_time }, ...] }
  app.put(
    "/api/volunteers/:userId/availability",
    rateLimit(),
    async (req, res) => {
      try {
        const userId = req.params.userId;
        const { schedule } = req.body;

        if (!Array.isArray(schedule)) {
          return res.status(400).json({ error: "schedule must be an array" });
        }

        const conn = await pool.promise().getConnection();
        try {
          await conn.beginTransaction();

          for (const slot of schedule) {
            const { day_of_week, available, start_time, end_time } = slot;
            await conn.query(
              `INSERT INTO VolunteerAvailability (user_id, day_of_week, available, start_time, end_time)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE available = VALUES(available), start_time = VALUES(start_time), end_time = VALUES(end_time)`,
              [
                userId,
                day_of_week,
                available,
                start_time || null,
                end_time || null,
              ],
            );
          }

          await conn.commit();

          await logAudit(
            pool,
            userId,
            "UPDATE_AVAILABILITY",
            "VolunteerAvailability",
            userId,
          );

          const [rows] = await conn.query(
            "SELECT * FROM VolunteerAvailability WHERE user_id = ? ORDER BY FIELD(day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')",
            [userId],
          );

          res.json(rows);
        } catch (innerErr) {
          await conn.rollback();
          throw innerErr;
        } finally {
          conn.release();
        }
      } catch (err) {
        console.error("Error saving availability:", err);
        res.status(500).json({ error: "Failed to save availability" });
      }
    },
  );

  // ─── Volunteer Unavailable Dates ─────────────────────────────────────

  // GET /api/volunteers/:userId/unavailable-dates
  app.get("/api/volunteers/:userId/unavailable-dates", async (req, res) => {
    try {
      const userId = req.params.userId;
      const [rows] = await pool
        .promise()
        .query(
          "SELECT * FROM VolunteerUnavailableDate WHERE user_id = ? ORDER BY unavailable_date ASC",
          [userId],
        );
      res.json(rows);
    } catch (err) {
      console.error("Error fetching unavailable dates:", err);
      res.status(500).json({ error: "Failed to fetch unavailable dates" });
    }
  });

  // POST /api/volunteers/:userId/unavailable-dates
  // Body: { unavailable_date, reason? }
  app.post(
    "/api/volunteers/:userId/unavailable-dates",
    rateLimit(),
    async (req, res) => {
      try {
        const userId = req.params.userId;
        const { unavailable_date, reason } = req.body;

        if (!unavailable_date) {
          return res
            .status(400)
            .json({ error: "unavailable_date is required" });
        }

        const [result] = await pool
          .promise()
          .query(
            "INSERT INTO VolunteerUnavailableDate (user_id, unavailable_date, reason) VALUES (?, ?, ?)",
            [userId, unavailable_date, reason || null],
          );

        await logAudit(
          pool,
          userId,
          "ADD_UNAVAILABLE_DATE",
          "VolunteerUnavailableDate",
          result.insertId,
        );

        res.status(201).json({
          unavailable_id: result.insertId,
          user_id: Number(userId),
          unavailable_date,
          reason: reason || null,
        });
      } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res
            .status(409)
            .json({ error: "Date already marked as unavailable" });
        }
        console.error("Error adding unavailable date:", err);
        res.status(500).json({ error: "Failed to add unavailable date" });
      }
    },
  );

  // DELETE /api/volunteers/:userId/unavailable-dates/:id
  app.delete(
    "/api/volunteers/:userId/unavailable-dates/:id",
    async (req, res) => {
      try {
        const { userId, id } = req.params;

        const [result] = await pool
          .promise()
          .query(
            "DELETE FROM VolunteerUnavailableDate WHERE unavailable_id = ? AND user_id = ?",
            [id, userId],
          );

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Unavailable date not found" });
        }

        await logAudit(
          pool,
          userId,
          "REMOVE_UNAVAILABLE_DATE",
          "VolunteerUnavailableDate",
          id,
        );

        res.json({ deleted: true });
      } catch (err) {
        console.error("Error removing unavailable date:", err);
        res.status(500).json({ error: "Failed to remove unavailable date" });
      }
    },
  );

  // ── Resource-based shift management ──────────────────────────────

  // GET /api/resources/:resourceId/volunteers
  // Returns all active volunteers connected to this resource
  app.get("/api/resources/:resourceId/volunteers", async (req, res) => {
    try {
      const resourceId = req.params.resourceId;

      const [rows] = await pool.promise().query(
        `SELECT
          vrc.connection_id,
          vrc.user_id,
          vrc.active,
          up.first_name,
          up.last_name,
          u.email
        FROM VolunteerResourceConnection vrc
        JOIN \`User\` u ON vrc.user_id = u.user_id
        JOIN UserProfile up ON vrc.user_id = up.user_id
        WHERE vrc.resource_id = ? AND vrc.active = 1
        ORDER BY up.last_name ASC, up.first_name ASC`,
        [resourceId],
      );

      res.json(rows);
    } catch (err) {
      console.error("Error fetching resource volunteers:", err);
      res.status(500).json({ error: "Failed to fetch resource volunteers" });
    }
  });

  // GET /api/resources/:resourceId/volunteers-availability?date=YYYY-MM-DD
  // Returns resource volunteers enriched with availability status for the given date.
  // Each volunteer gets: available (boolean), unavailable_reason (string|null)
  app.get(
    "/api/resources/:resourceId/volunteers-availability",
    async (req, res) => {
      try {
        const resourceId = req.params.resourceId;
        const { date } = req.query; // YYYY-MM-DD

        if (!date) {
          return res
            .status(400)
            .json({ error: "date query param is required" });
        }

        // 1) Get active resource volunteers
        const [volunteers] = await pool.promise().query(
          `SELECT
            vrc.connection_id,
            vrc.user_id,
            up.first_name,
            up.last_name,
            u.email
          FROM VolunteerResourceConnection vrc
          JOIN \`User\` u ON vrc.user_id = u.user_id
          JOIN UserProfile up ON vrc.user_id = up.user_id
          WHERE vrc.resource_id = ? AND vrc.active = 1
          ORDER BY up.last_name ASC, up.first_name ASC`,
          [resourceId],
        );

        if (volunteers.length === 0) return res.json([]);

        const userIds = volunteers.map((v) => v.user_id);

        // 2) Check specific unavailable dates
        const [unavailRows] = await pool.promise().query(
          `SELECT user_id
           FROM VolunteerUnavailableDate
           WHERE user_id IN (?) AND unavailable_date = ?`,
          [userIds, date],
        );
        const unavailSet = new Set(unavailRows.map((r) => r.user_id));

        // 3) Determine the day-of-week name for the date
        const jsDate = new Date(date + "T12:00:00");
        const dayNames = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        const dayName = dayNames[jsDate.getDay()];

        // 4) Get weekly availability for this day
        const [availRows] = await pool.promise().query(
          `SELECT user_id, available, start_time, end_time
           FROM VolunteerAvailability
           WHERE user_id IN (?) AND day_of_week = ?`,
          [userIds, dayName],
        );
        const availMap = {};
        availRows.forEach((r) => {
          availMap[r.user_id] = r;
        });

        // 5) Build response
        const result = volunteers.map((v) => {
          if (unavailSet.has(v.user_id)) {
            return {
              ...v,
              available: false,
              unavailable_reason: "Marked unavailable for this date",
            };
          }
          const weekAvail = availMap[v.user_id];
          if (!weekAvail || !weekAvail.available) {
            return {
              ...v,
              available: false,
              unavailable_reason: `Not available on ${dayName}s`,
            };
          }
          return { ...v, available: true, unavailable_reason: null };
        });

        res.json(result);
      } catch (err) {
        console.error("Error fetching volunteers availability:", err);
        res
          .status(500)
          .json({ error: "Failed to fetch volunteers availability" });
      }
    },
  );

  // POST /api/resources/:resourceId/shifts
  // Create a new shift for a resource. Creates a VolunteerOpportunity if none exists.
  app.post(
    "/api/resources/:resourceId/shifts",
    rateLimit(),
    async (req, res) => {
      const conn = await pool.promise().getConnection();
      try {
        const resourceId = req.params.resourceId;
        const { start_datetime, end_datetime, capacity } = req.body;

        if (!start_datetime || !end_datetime) {
          return res
            .status(400)
            .json({ error: "start_datetime and end_datetime are required" });
        }

        await conn.beginTransaction();

        // Find existing VolunteerOpportunity for this resource
        const [oppRows] = await conn.query(
          "SELECT opportunity_id FROM VolunteerOpportunity WHERE resource_id = ? LIMIT 1",
          [resourceId],
        );

        let opportunityId;
        if (oppRows.length > 0) {
          opportunityId = oppRows[0].opportunity_id;
        } else {
          // Look up provider_id and location_id from the resource
          const [resRows] = await conn.query(
            "SELECT provider_id, location_id, name FROM Resource WHERE resource_id = ?",
            [resourceId],
          );
          if (resRows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: "Resource not found" });
          }
          const r = resRows[0];
          const [oppResult] = await conn.query(
            `INSERT INTO VolunteerOpportunity (provider_id, location_id, resource_id, title, status)
           VALUES (?, ?, ?, ?, 'open')`,
            [
              r.provider_id,
              r.location_id,
              resourceId,
              `${r.name} - Volunteer Shifts`,
            ],
          );
          opportunityId = oppResult.insertId;
        }

        const [result] = await conn.query(
          `INSERT INTO VolunteerShift (opportunity_id, start_datetime, end_datetime, capacity)
         VALUES (?, ?, ?, ?)`,
          [
            opportunityId,
            start_datetime,
            end_datetime,
            capacity != null && capacity !== "" ? capacity : 0,
          ],
        );

        await conn.commit();
        res.status(201).json({
          shift_id: result.insertId,
          message: "Shift added successfully",
        });
      } catch (err) {
        await conn.rollback();
        console.error("Error adding resource shift:", err);
        res.status(500).json({ error: "Failed to add shift" });
      } finally {
        conn.release();
      }
    },
  );

  // GET /api/resources/:resourceId/shifts
  // Returns shifts linked to this resource, optionally filtered by date.
  // Query params: ?date=YYYY-MM-DD
  // Each shift includes its signups (volunteer names).
  app.get("/api/resources/:resourceId/shifts", async (req, res) => {
    try {
      const resourceId = req.params.resourceId;
      const { date } = req.query;

      let query = `
        SELECT
          vs.shift_id,
          vs.start_datetime,
          vs.end_datetime,
          vs.capacity,
          vo.opportunity_id,
          vo.title AS opportunity_title
        FROM VolunteerShift vs
        JOIN VolunteerOpportunity vo ON vs.opportunity_id = vo.opportunity_id
        WHERE vo.resource_id = ?
      `;
      const params = [resourceId];

      if (date) {
        query += " AND DATE(vs.start_datetime) = ?";
        params.push(date);
      }

      query += " ORDER BY vs.start_datetime ASC";

      const [shifts] = await pool.promise().query(query, params);

      // For each shift, fetch signups
      for (const shift of shifts) {
        const [signups] = await pool.promise().query(
          `SELECT
            s.signup_id,
            s.user_id,
            s.status,
            up.first_name,
            up.last_name,
            u.email
          FROM VolunteerSignup s
          JOIN \`User\` u ON s.user_id = u.user_id
          JOIN UserProfile up ON s.user_id = up.user_id
          WHERE s.shift_id = ? AND s.status = 'registered'
          ORDER BY up.last_name ASC`,
          [shift.shift_id],
        );
        shift.signups = signups;
      }

      res.json(shifts);
    } catch (err) {
      console.error("Error fetching resource shifts:", err);
      res.status(500).json({ error: "Failed to fetch resource shifts" });
    }
  });

  // GET /api/resources/:resourceId/shift-dates
  // Returns distinct dates that have shifts for this resource (for calendar highlighting)
  app.get("/api/resources/:resourceId/shift-dates", async (req, res) => {
    try {
      const resourceId = req.params.resourceId;

      const [rows] = await pool.promise().query(
        `SELECT DISTINCT DATE(vs.start_datetime) AS shift_date
         FROM VolunteerShift vs
         JOIN VolunteerOpportunity vo ON vs.opportunity_id = vo.opportunity_id
         WHERE vo.resource_id = ?
         ORDER BY shift_date ASC`,
        [resourceId],
      );

      res.json(rows.map((r) => r.shift_date));
    } catch (err) {
      console.error("Error fetching resource shift dates:", err);
      res.status(500).json({ error: "Failed to fetch shift dates" });
    }
  });
};
