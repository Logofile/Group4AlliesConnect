const bcrypt = require("bcrypt");
const saltRounds = 10;
const { requireRole } = require("../middleware/permissions");

// Validate phone number format (10 digits)
const isValidPhoneFormat = (phone) => {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ""));
};

// Validate email format
const isValidEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password format (more than 6 characters, at least one capital letter, at least one special character, no spaces)
const isValidPasswordFormat = (password) => {
  const hasMinLength = password.length > 6;
  const hasCapitalLetter = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{}|;:',.<>?/~`]/.test(password);
  const hasNoSpaces = !/\s/.test(password);
  return hasMinLength && hasCapitalLetter && hasSpecialChar && hasNoSpaces;
};

// Validate username format (3-50 characters, letters/numbers/underscores/hyphens only, no spaces)
const isValidUsernameFormat = (username) => {
  const hasValidLength = username.length >= 3 && username.length <= 50;
  const hasValidChars = /^[a-zA-Z0-9_-]+$/.test(username);
  const hasNoSpaces = !/\s/.test(username);
  return hasValidLength && hasValidChars && hasNoSpaces;
};

// Validate EIN format (XX-XXXXXXX, 9 digits with dash)
const isValidEINFormat = (ein) => {
  const einRegex = /^\d{2}-\d{7}$/;
  return einRegex.test(ein);
};

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
        first_name,
        last_name,
        zip_code,
        ein,
        verification_method,
      } = req.body;

      if (
        !username ||
        !email ||
        !password ||
        !first_name ||
        !last_name ||
        !organization_name ||
        !phone_number ||
        !zip_code ||
        !ein
      ) {
        return res.status(400).json({
          error:
            "username, email, password, first_name, last_name, organization_name, phone_number, zip_code, and ein are required",
        });
      }

      // Validate formats
      if (!isValidUsernameFormat(username)) {
        return res.status(400).json({
          error:
            "Username must be 3-50 characters, contain only letters, numbers, underscores, and hyphens, with no spaces",
        });
      }

      if (!isValidEmailFormat(email)) {
        return res.status(400).json({
          error: "Invalid email format",
        });
      }

      if (!isValidPasswordFormat(password)) {
        return res.status(400).json({
          error:
            "Password must be more than 6 characters, contain at least one capital letter, one special character (!@#$%^&*()_+-=[]{}|;:',./~`), and no spaces",
        });
      }

      if (phone_number && !isValidPhoneFormat(phone_number)) {
        return res.status(400).json({
          error: "Phone number must be 10 digits",
        });
      }

      if (!isValidEINFormat(ein)) {
        return res.status(400).json({
          error: "EIN must be in the format XX-XXXXXXX (9 digits)",
        });
      }

      const [existingEmails] = await pool
        .promise()
        .query("SELECT user_id FROM User WHERE email = ?", [email]);

      if (existingEmails.length > 0) {
        return res.status(400).json({
          error: "An account with that email already exists",
        });
      }

      const [existingUsernames] = await pool
        .promise()
        .query("SELECT user_id FROM User WHERE username = ?", [username]);

      if (existingUsernames.length > 0) {
        return res.status(400).json({
          error: "That username is already in use",
        });
      }

      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const [userResult] = await pool
        .promise()
        .query(
          "INSERT INTO User (username, email, password_hash, status) VALUES (?, ?, ?, 'active')",
          [username, email, hashedPassword],
        );

      const userId = userResult.insertId;

      await pool
        .promise()
        .query(
          "INSERT INTO UserProfile (user_id, first_name, last_name, phone, zip_code) VALUES (?, ?, ?, ?, ?)",
          [userId, first_name, last_name, phone_number, zip_code],
        );

      const [providerResult] = await pool.promise().query(
        `INSERT INTO ServiceProvider (name, ein, phone_number, status)
         VALUES (?, ?, ?, 'pending')`,
        [organization_name, ein, phone_number],
      );

      const providerId = providerResult.insertId;

      await pool.promise().query(
        `INSERT INTO ServiceProviderClaim (provider_id, user_id, status, verification_method)
         VALUES (?, ?, 'pending', ?)`,
        [providerId, userId, verification_method || "ein"],
      );

      await pool
        .promise()
        .query(
          "INSERT INTO UserRole (user_id, role_id) SELECT ?, role_id FROM Role WHERE role_name = 'provider'",
          [userId],
        );

      await pool
        .promise()
        .query(
          "INSERT INTO ServiceProviderUser (provider_id, user_id) VALUES (?, ?)",
          [providerId, userId],
        );

      res.status(201).json({
        message: "Organization registered successfully",
        user_id: userId,
        provider_id: providerId,
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
        [providerId],
      );

      if (rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Organization profile not found" });
      }

      res.json(rows[0]);
    } catch (err) {
      console.error("Error fetching organization profile:", err);
      res.status(500).json({ error: "Failed to fetch organization profile" });
    }
  });

  // PUT /api/organizations/profile/:id
  // Updates organization profile details
  app.put(
    "/api/organizations/profile/:id",
    requireRole(pool, "provider"),
    async (req, res) => {
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
          logo_url,
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

        await pool
          .promise()
          .query(query, [
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
            providerId,
          ]);

        res.json({ message: "Organization profile updated successfully" });
      } catch (err) {
        console.error("Error updating organization profile:", err);
        res
          .status(500)
          .json({ error: "Failed to update organization profile" });
      }
    },
  );

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
