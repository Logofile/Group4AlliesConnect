const { logAudit } = require("../utils/logging");
const { requireRole } = require("../middleware/permissions");
const { rateLimit } = require("../middleware/rateLimit");

module.exports = function (app, pool) {
  // GET /api/admin/accounts
  // Retrieves all user accounts for admin account management
  app.get("/api/admin/accounts", requireRole(pool, "admin"), async (req, res) => {
    try {
      const [rows] = await pool.promise().query(
        `SELECT
          u.user_id,
          u.username,
          u.email,
          u.status,
          p.first_name,
          p.last_name,
          p.phone,
          p.zip_code,
          CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')) AS name,
          GROUP_CONCAT(DISTINCT r.role_name ORDER BY r.role_name SEPARATOR ',') AS roles,
          NULL AS date_created,
          NULL AS date_updated
        FROM User u
        LEFT JOIN UserProfile p ON u.user_id = p.user_id
        LEFT JOIN UserRole ur ON u.user_id = ur.user_id
        LEFT JOIN Role r ON ur.role_id = r.role_id
        GROUP BY
          u.user_id,
          u.username,
          u.email,
          u.status,
          p.first_name,
          p.last_name,
          p.phone,
          p.zip_code
        ORDER BY u.user_id DESC`,
      );

      const accounts = rows.map((row) => ({
        ...row,
        name: (row.name || "").trim() || "N/A",
        roles: row.roles || "N/A",
      }));

      res.json(accounts);
    } catch (err) {
      console.error("Error fetching admin accounts:", err);
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  // DELETE /api/admin/accounts/:id
  // Allows admin to delete an account (except their own)
  app.delete(
    "/api/admin/accounts/:id",
    rateLimit(),
    requireRole(pool, "admin"),
    async (req, res) => {
      try {
        const targetUserId = Number(req.params.id);
        const actorUserId = Number(req.currentUser?.user_id || 0);

        if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
          return res.status(400).json({ error: "Invalid user id" });
        }

        if (targetUserId === actorUserId) {
          return res.status(400).json({ error: "Admins cannot delete their own account" });
        }

        const [result] = await pool
          .promise()
          .query("DELETE FROM User WHERE user_id = ?", [targetUserId]);

        if (!result.affectedRows) {
          return res.status(404).json({ error: "Account not found" });
        }

        await logAudit(pool, actorUserId || 1, "DELETE_ACCOUNT", "User", targetUserId);

        res.json({ message: "Account deleted" });
      } catch (err) {
        console.error("Error deleting account:", err);
        res.status(500).json({ error: "Failed to delete account" });
      }
    },
  );

  // GET /api/admin/pending-providers
  // Retrieves providers waiting for approval
  app.get(
    "/api/admin/pending-providers",
    requireRole(pool, "admin"),
    async (req, res) => {
      try {
        const [rows] = await pool
          .promise()
          .query("SELECT * FROM ServiceProvider WHERE status = 'pending'");

        res.json(rows);
      } catch (err) {
        console.error("Error fetching pending providers:", err);
        res.status(500).json({ error: "Failed to fetch pending providers" });
      }
    },
  );

  // PATCH /api/admin/providers/:id/status
  // Allows admin to approve, reject, or suspend providers
  app.patch(
    "/api/admin/providers/:id/status",
    rateLimit(),
    requireRole(pool, "admin"),
    async (req, res) => {
      try {
        const providerId = req.params.id;
        const { status } = req.body;

        if (!["active", "pending", "suspended"].includes(status)) {
          return res.status(400).json({
            error: "Invalid status value",
          });
        }

        await pool
          .promise()
          .query(
            "UPDATE ServiceProvider SET status = ? WHERE provider_id = ?",
            [status, providerId],
          );

        await logAudit(
          pool,
          1,
          "UPDATE_PROVIDER_STATUS",
          "ServiceProvider",
          providerId,
        );

        res.json({ message: "Provider status updated" });
      } catch (err) {
        console.error("Error updating provider status:", err);
        res.status(500).json({ error: "Failed to update provider status" });
      }
    },
  );

  // PATCH /api/admin/content/:type/:id
  // Allows admin to deactivate resources/events/opportunities
  app.patch(
    "/api/admin/content/:type/:id",
    rateLimit(),
    requireRole(pool, "admin"),
    async (req, res) => {
      try {
        const { type, id } = req.params;

        let table;

        if (type === "resource") table = "Resource";
        else if (type === "event") table = "Event";
        else if (type === "opportunity") table = "VolunteerOpportunity";
        else {
          return res.status(400).json({ error: "Invalid content type" });
        }

        await pool
          .promise()
          .query(
            `UPDATE ${table} SET status = 'inactive' WHERE ${type}_id = ?`,
            [id],
          );

        res.json({ message: `${type} deactivated` });
      } catch (err) {
        console.error("Error moderating content:", err);
        res.status(500).json({ error: "Failed to moderate content" });
      }
    },
  );

  // GET /api/admin/logs
  // Returns audit logs
  app.get("/api/admin/logs", requireRole(pool, "admin"), async (req, res) => {
    try {
      const [rows] = await pool
        .promise()
        .query("SELECT * FROM AuditLog ORDER BY occured_at DESC LIMIT 100");

      res.json(rows);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // PATCH /api/admin/providers/:id/approve
  // Approve provider and log the action
  app.patch(
    "/api/admin/providers/:id/approve",
    rateLimit(),
    requireRole(pool, "admin"),
    async (req, res) => {
      const providerId = req.params.id;

      try {
        await pool
          .promise()
          .query(
            "UPDATE ServiceProvider SET status = 'active' WHERE provider_id = ?",
            [providerId],
          );

        await logAudit(
          pool,
          1,
          "APPROVE_PROVIDER",
          "ServiceProvider",
          providerId,
        );

        res.json({ message: "Provider approved" });
      } catch (err) {
        console.error("Error approving provider:", err);
        res.status(500).json({ error: "Failed to approve provider" });
      }
    },
  );
};
