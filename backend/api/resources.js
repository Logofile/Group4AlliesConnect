const { logAudit } = require("../utils/logging");
const { requireRole } = require("../middleware/permissions");
const { geocodeAddress } = require("../utils/geocode");

module.exports = function (app, pool) {
  // GET /api/resources
  // Optional filters: category, zip
  app.get("/api/resources", async (req, res) => {
    try {
      const { category, zip } = req.query;

      let query = `
        SELECT
          r.resource_id,
          r.provider_id,
          r.category_id,
          r.location_id,
          r.name,
          r.description,
          r.hours,
          r.image_url,
          r.eligibility_requirements,
          r.contact_name,
          r.contact_email,
          r.contact_phone,
          r.languages_spoken,
          r.accessibility,
          r.social_media_links,
          s.name AS provider_name,
          c.name AS category_name,
          l.street_address_1,
          l.street_address_2,
          l.city,
          l.state,
          l.zip,
          l.latitude,
          l.longitude
        FROM Resource r
        JOIN ServiceProvider s ON r.provider_id = s.provider_id
        JOIN Category c ON r.category_id = c.category_id
        JOIN Location l ON r.location_id = l.location_id
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

      query += " ORDER BY r.name ASC";

      const [rows] = await pool.promise().query(query, params);
      res.json(rows);
    } catch (err) {
      console.error("Error fetching resources:", err);
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  });

  // GET /api/resources/:id
  // Returns full resource details
  app.get("/api/resources/:id", async (req, res) => {
    try {
      const resourceId = req.params.id;

      const query = `
        SELECT
          r.resource_id,
          r.provider_id,
          r.category_id,
          r.location_id,
          r.name,
          r.description,
          r.hours,
          r.image_url,
          r.eligibility_requirements,
          r.contact_name,
          r.contact_email,
          r.contact_phone,
          r.languages_spoken,
          r.accessibility,
          r.social_media_links,
          s.name AS provider_name,
          c.name AS category_name,
          l.street_address_1,
          l.street_address_2,
          l.city,
          l.state,
          l.zip,
          l.latitude,
          l.longitude
        FROM Resource r
        JOIN ServiceProvider s ON r.provider_id = s.provider_id
        JOIN Category c ON r.category_id = c.category_id
        JOIN Location l ON r.location_id = l.location_id
        WHERE r.resource_id = ?
      `;

      const [rows] = await pool.promise().query(query, [resourceId]);

      if (rows.length === 0) {
        return res.status(404).json({ error: "Resource not found" });
      }

      res.json(rows[0]);
    } catch (err) {
      console.error("Error fetching resource details:", err);
      res.status(500).json({ error: "Failed to fetch resource details" });
    }
  });

  // GET /api/categories
  // Returns available categories for filters
  app.get("/api/categories", async (req, res) => {
    try {
      const [rows] = await pool
        .promise()
        .query(
          "SELECT category_id, name, type FROM Category ORDER BY name ASC",
        );

      res.json(rows);
    } catch (err) {
      console.error("Error fetching categories:", err);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // POST /api/resources
  // Creates a new resource with location
  app.post(
    "/api/resources",
    requireRole(pool, "provider"),
    async (req, res) => {
      const conn = await pool.promise().getConnection();

      try {
        const {
          provider_id,
          name,
          street_address,
          city,
          state,
          zip,
          hours,
          category_ids,
          image_url,
          description,
          eligibility_requirements,
          contact_name,
          contact_email,
          contact_phone,
          languages_spoken,
          accessibility,
          social_media_links,
        } = req.body;

        if (
          !provider_id ||
          !name ||
          !street_address ||
          !city ||
          !state ||
          !zip ||
          !hours ||
          !category_ids ||
          category_ids.length === 0
        ) {
          conn.release();
          return res.status(400).json({ error: "Missing required fields." });
        }

        await conn.beginTransaction();

        // Geocode address for lat/lng
        const coords = await geocodeAddress({
          street: street_address,
          city,
          state,
          zip,
        });

        // Reuse existing location if same coordinates exist
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

        // Insert new location if needed
        if (!locationId) {
          const [locResult] = await conn.query(
            `INSERT INTO Location (street_address_1, city, state, zip, latitude, longitude)
           VALUES (?, ?, ?, ?, ?, ?)`,
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

        // Use first category_id for now
        const categoryId = category_ids[0];

        const [resourceResult] = await conn.query(
          `INSERT INTO Resource (
          provider_id,
          category_id,
          location_id,
          name,
          description,
          hours,
          image_url,
          eligibility_requirements,
          contact_name,
          contact_email,
          contact_phone,
          languages_spoken,
          accessibility,
          social_media_links
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            provider_id,
            categoryId,
            locationId,
            name,
            description || null,
            hours,
            image_url || null,
            eligibility_requirements || null,
            contact_name || null,
            contact_email || null,
            contact_phone || null,
            languages_spoken || null,
            accessibility || null,
            social_media_links || null,
          ],
        );

        await conn.commit();

        await logAudit(
          pool,
          1,
          "CREATE_RESOURCE",
          "Resource",
          resourceResult.insertId,
        );

        res.status(201).json({
          message: "Resource created successfully",
          resource_id: resourceResult.insertId,
        });
      } catch (err) {
        await conn.rollback();
        console.error("Error creating resource:", err);
        res.status(500).json({ error: "Failed to create resource" });
      } finally {
        conn.release();
      }
    },
  );

  // PUT /api/resources/:id
  // Updates an existing resource
  app.put(
    "/api/resources/:id",
    requireRole(pool, "provider"),
    async (req, res) => {
      try {
        const resourceId = req.params.id;
        const {
          category_id,
          location_id,
          name,
          description,
          hours,
          image_url,
          eligibility_requirements,
          contact_name,
          contact_email,
          contact_phone,
          languages_spoken,
          accessibility,
          social_media_links,
        } = req.body;

        const query = `
        UPDATE Resource
        SET
          category_id = ?,
          location_id = ?,
          name = ?,
          description = ?,
          hours = ?,
          image_url = ?,
          eligibility_requirements = ?,
          contact_name = ?,
          contact_email = ?,
          contact_phone = ?,
          languages_spoken = ?,
          accessibility = ?,
          social_media_links = ?
        WHERE resource_id = ?
      `;

        await pool
          .promise()
          .query(query, [
            category_id,
            location_id,
            name,
            description || null,
            hours || null,
            image_url || null,
            eligibility_requirements || null,
            contact_name || null,
            contact_email || null,
            contact_phone || null,
            languages_spoken || null,
            accessibility || null,
            social_media_links || null,
            resourceId,
          ]);

        await logAudit(pool, 1, "UPDATE_RESOURCE", "Resource", resourceId);

        res.json({ message: "Resource updated successfully" });
      } catch (err) {
        console.error("Error updating resource:", err);
        res.status(500).json({ error: "Failed to update resource" });
      }
    },
  );

  // DELETE /api/resources/:id
  // Deletes a resource
  app.delete(
    "/api/resources/:id",
    requireRole(pool, "provider"),
    async (req, res) => {
      try {
        const resourceId = req.params.id;

        await pool
          .promise()
          .query("DELETE FROM Resource WHERE resource_id = ?", [resourceId]);

        await logAudit(pool, 1, "DELETE_RESOURCE", "Resource", resourceId);

        res.json({ message: "Resource deleted successfully" });
      } catch (err) {
        console.error("Error deleting resource:", err);
        res.status(500).json({ error: "Failed to delete resource" });
      }
    },
  );
};
