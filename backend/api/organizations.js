const bcrypt = require("bcrypt");
const saltRounds = 10;
const { requireRole } = require("../middleware/permissions");

module.exports = function (app, pool) {
  // POST /api/organizations/register
  // Creates a new user, provider, and provider claim
  app.post("/api/organizations/register", async (req, res) => {
    try {
      const {
        username,
        email,
        password,
        organization_name,
        phone_number,
        ein,
        verification_method
      } = req.body;

      if (!username || !email || !password || !organization_name || !ein) {
        return res.status(400).json({
          error: "username, email, password, organization_name, and ein are required"
        });
      }

      const [existingEmails] = await pool.promise().query(
        "SELECT user_id FROM User WHERE email = ?",
        [email]
      );

      if (existingEmails.length > 0) {
        return res.status(400).json({
          error: "An account with that email already exists"
        });
      }

      const [existingUsernames] = await pool.promise().query(
        "SELECT user_id FROM User WHERE username = ?",
        [username]
      );

      if (existingUsernames.length > 0) {
        return res.status(400).json({
          error: "That username is already in use"
        });
      }

      const [existingProviders] = await pool.promise().query(
        "SELECT provider_id FROM ServiceProvider WHERE ein = ?",
        [ein]
      );

      if (existingProviders.length > 0) {
        return res.status(400).json({
          error: "An organization with that EIN already exists"
        });
      }

      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const [userResult] = await pool.promise().query(
        "INSERT INTO User (username, email, password_hash, status) VALUES (?, ?, ?, 'active')",
        [username, email, hashedPassword]
      );

      const userId = userResult.insertId;

      const [providerResult] = await pool.promise().query(
        `INSERT INTO ServiceProvider (name, ein, phone_number, status)
         VALUES (?, ?, ?, 'pending')`,
        [
          organization_name,
          ein,
          phone_number || null
        ]
      );

      const providerId = providerResult.insertId;

      await pool.promise().query(
        `INSERT INTO ServiceProviderClaim (provider_id, user_id, status, verification_method)
         VALUES (?, ?, 'pending', ?)`,
        [
          providerId,
          userId,
          verification_method || "ein"
        ]
      );

      await pool.promise().query(
        "INSERT INTO UserRole (user_id, role_id) SELECT ?, role_id FROM Role WHERE role_name = 'provider'",
        [userId]
      );

      await pool.promise().query(
        "INSERT INTO ServiceProviderUser (provider_id, user_id) VALUES (?, ?)",
        [providerId, userId]
      );

      res.status(201).json({
        message: "Organization registered successfully",
        user_id: userId,
        provider_id: providerId
      });
    } catch (err) {
      console.error("Error registering organization:", err);
      res.status(500).json({ error: "Failed to register organization" });
    }
  });

  // GET /api/organizations/profile/:id
  // Returns organization profile details
  app.get("/api/organizations/profile/:id", async (req, res) => {
    try {
      const providerId = req.params.id;

      const [rows] = await pool.promise().query(
        `
        SELECT
          provider_id,
          location_id,
          name,
          ein,
          common_name,
          phone_number,
          website,
          organization_type,
          mission,
          contact_name,
          contact_email,
          contact_phone,
          operating_hours,
          languages_spoken,
          accessibility,
          logo_url,
          status
        FROM ServiceProvider
        WHERE provider_id = ?
        `,
        [providerId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Organization profile not found" });
      }

      res.json(rows[0]);
    } catch (err) {
      console.error("Error fetching organization profile:", err);
      res.status(500).json({ error: "Failed to fetch organization profile" });
    }
  });

  // PUT /api/organizations/profile/:id
  // Updates organization profile details
  app.put("/api/organizations/profile/:id", requireRole(pool, "provider"), async (req, res) => {
    try {
      const providerId = req.params.id;
      const {
        common_name,
        phone_number,
        website,
        organization_type,
        mission,
        contact_name,
        contact_email,
        contact_phone,
        operating_hours,
        languages_spoken,
        accessibility,
        logo_url
      } = req.body;

      const query = `
        UPDATE ServiceProvider
        SET
          common_name = ?,
          phone_number = ?,
          website = ?,
          organization_type = ?,
          mission = ?,
          contact_name = ?,
          contact_email = ?,
          contact_phone = ?,
          operating_hours = ?,
          languages_spoken = ?,
          accessibility = ?,
          logo_url = ?
        WHERE provider_id = ?
      `;

      await pool.promise().query(query, [
        common_name || null,
        phone_number || null,
        website || null,
        organization_type || null,
        mission || null,
        contact_name || null,
        contact_email || null,
        contact_phone || null,
        operating_hours || null,
        languages_spoken || null,
        accessibility || null,
        logo_url || null,
        providerId
      ]);

      res.json({ message: "Organization profile updated successfully" });
    } catch (err) {
      console.error("Error updating organization profile:", err);
      res.status(500).json({ error: "Failed to update organization profile" });
    }
  });

  // GET /api/organizations/signups/export/:shiftId
  // Returns volunteer signup roster data for a shift
  app.get("/api/organizations/signups/export/:shiftId", async (req, res) => {
    try {
      const shiftId = req.params.shiftId;

      const query = `
        SELECT
          vs.signup_id,
          vs.shift_id,
          vs.user_id,
          vs.status,
          up.first_name,
          up.last_name,
          up.phone,
          up.zip_code,
          u.email
        FROM VolunteerSignup vs
        JOIN User u ON vs.user_id = u.user_id
        JOIN UserProfile up ON u.user_id = up.user_id
        WHERE vs.shift_id = ?
        ORDER BY up.last_name ASC, up.first_name ASC
      `;

      const [rows] = await pool.promise().query(query, [shiftId]);

      res.json(rows);
    } catch (err) {
      console.error("Error exporting volunteer signups:", err);
      res.status(500).json({ error: "Failed to export volunteer signups" });
    }
  });
};
