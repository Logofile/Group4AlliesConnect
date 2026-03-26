const bcrypt = require("bcrypt");
const saltRounds = 10;

module.exports = function (app, pool) {
  // POST /api/auth/register
  // Create a new user account and profile
  app.post("/api/auth/register", async (req, res) => {
    try {
      const {
        username,
        email,
        password,
        first_name,
        last_name,
        phone,
        zip_code
      } = req.body;

      if (!username || !email || !password || !first_name || !last_name || !phone || !zip_code) {
        return res.status(400).json({
          error: "username, email, password, first_name, last_name, phone, and zip_code are required"
        });
      }

      const [existingUsers] = await pool.promise().query(
        "SELECT user_id FROM User WHERE email = ?",
        [email]
      );

      if (existingUsers.length > 0) {
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

      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const [userResult] = await pool.promise().query(
        "INSERT INTO User (username, email, password_hash, status) VALUES (?, ?, ?, 'active')",
        [username, email, hashedPassword]
      );

      const userId = userResult.insertId;

      await pool.promise().query(
        "INSERT INTO UserProfile (user_id, first_name, last_name, phone, zip_code) VALUES (?, ?, ?, ?, ?)",
        [userId, first_name, last_name, phone, zip_code]
      );

      // Default role = user
      await pool.promise().query(
        "INSERT INTO UserRole (user_id, role_id) SELECT ?, role_id FROM Role WHERE role_name = 'user'",
        [userId]
      );

      res.status(201).json({
        message: "User registered successfully",
        user_id: userId
      });
    } catch (err) {
      console.error("Error registering user:", err);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  // POST /api/auth/login
  // Basic login check + return user roles
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: "email and password are required"
        });
      }

      const [rows] = await pool.promise().query(
        "SELECT * FROM User WHERE email = ?",
        [email]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const user = rows[0];

      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const [roleRows] = await pool.promise().query(
        `SELECT r.role_name
         FROM UserRole ur
         JOIN Role r ON ur.role_id = r.role_id
         WHERE ur.user_id = ?`,
        [user.user_id]
      );

      const roles = roleRows.map(role => role.role_name);

      res.json({
        message: "Login successful",
        user_id: user.user_id,
        email: user.email,
        status: user.status,
        roles: roles
      });
    } catch (err) {
      console.error("Error logging in:", err);
      res.status(500).json({ error: "Failed to log in" });
    }
  });

  // POST /api/auth/password-reset
  // Placeholder until email reset flow is implemented
  app.post("/api/auth/password-reset", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "email is required" });
      }

      res.json({
        message: "Password reset process not implemented yet"
      });
    } catch (err) {
      console.error("Error initiating password reset:", err);
      res.status(500).json({ error: "Failed to start password reset" });
    }
  });

  // GET /api/users/profile/:id
  // Retrieve user profile
  app.get("/api/users/profile/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const [rows] = await pool.promise().query(
      `SELECT 
        u.user_id,
        u.email,
        u.status,
        p.first_name,
        p.last_name,
        p.phone,
        p.zip_code,
        GROUP_CONCAT(r.role_name) AS roles
       FROM User u
       JOIN UserProfile p ON u.user_id = p.user_id
       LEFT JOIN UserRole ur ON u.user_id = ur.user_id
       LEFT JOIN Role r ON ur.role_id = r.role_id
       WHERE u.user_id = ?
       GROUP BY u.user_id`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User profile not found" });
    }

    const user = rows[0];

    res.json({
      user_id: user.user_id,
      email: user.email,
      status: user.status,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      zip_code: user.zip_code,
      roles: user.roles ? user.roles.split(",") : []
    });

  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

  // PUT /api/users/profile/:id
  // Update user profile
  app.put("/api/users/profile/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const { first_name, last_name, phone, zip_code } = req.body;

      await pool.promise().query(
        `UPDATE UserProfile
         SET first_name = ?, last_name = ?, phone = ?, zip_code = ?
         WHERE user_id = ?`,
        [first_name, last_name, phone, zip_code, userId]
      );

      res.json({ message: "User profile updated successfully" });
    } catch (err) {
      console.error("Error updating user profile:", err);
      res.status(500).json({ error: "Failed to update user profile" });
    }
  });
};
