const { logAudit } = require("../utils/logging");
const { requireRole } = require("../middleware/permissions");

module.exports = function (app, pool) {

  // GET /api/admin/pending-providers
  // Retrieves providers waiting for approval
  app.get("/api/admin/pending-providers", requireRole(pool, "admin"), async (req, res) => {
    try {
      const [rows] = await pool.promise().query(
        "SELECT * FROM ServiceProvider WHERE status = 'pending'"
      );

      res.json(rows);
    } catch (err) {
      console.error("Error fetching pending providers:", err);
      res.status(500).json({ error: "Failed to fetch pending providers" });
    }
  });

  // PATCH /api/admin/providers/:id/status
  // Allows admin to approve, reject, or suspend providers
  app.patch("/api/admin/providers/:id/status", requireRole(pool, "admin"), async (req, res) => {
    try {
      const providerId = req.params.id;
      const { status } = req.body;

      if (!["active", "pending", "suspended"].includes(status)) {
        return res.status(400).json({
          error: "Invalid status value"
        });
      }

      await pool.promise().query(
        "UPDATE ServiceProvider SET status = ? WHERE provider_id = ?",
        [status, providerId]
      );

      await logAudit(pool, 1, "UPDATE_PROVIDER_STATUS", "ServiceProvider", providerId);
      
      res.json({ message: "Provider status updated" });

    } catch (err) {
      console.error("Error updating provider status:", err);
      res.status(500).json({ error: "Failed to update provider status" });
    }
  });

  // PATCH /api/admin/content/:type/:id
  // Allows admin to deactivate resources/events/opportunities
  app.patch("/api/admin/content/:type/:id", requireRole(pool, "admin"), async (req, res) => {
    try {
      const { type, id } = req.params;

      let table;

      if (type === "resource") table = "Resource";
      else if (type === "event") table = "Event";
      else if (type === "opportunity") table = "VolunteerOpportunity";
      else {
        return res.status(400).json({ error: "Invalid content type" });
      }

      await pool.promise().query(
        `UPDATE ${table} SET status = 'inactive' WHERE ${type}_id = ?`,
        [id]
      );

      res.json({ message: `${type} deactivated` });

    } catch (err) {
      console.error("Error moderating content:", err);
      res.status(500).json({ error: "Failed to moderate content" });
    }
  });

  // GET /api/admin/logs
  // Returns audit logs
  app.get("/api/admin/logs", requireRole(pool, "admin"), async (req, res) => {
    try {
      const [rows] = await pool.promise().query(
        "SELECT * FROM AuditLog ORDER BY occured_at DESC LIMIT 100"
      );

      res.json(rows);

    } catch (err) {
      console.error("Error fetching audit logs:", err);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // PATCH /api/admin/providers/:id/approve
  // Approve provider and log the action
  app.patch("/api/admin/providers/:id/approve", requireRole(pool, "admin"), async (req, res) => {
    const providerId = req.params.id;

    try {

      await pool.promise().query(
        "UPDATE ServiceProvider SET status = 'active' WHERE provider_id = ?",
        [providerId]
      );

      await logAudit(pool, 1, "APPROVE_PROVIDER", "ServiceProvider", providerId);

      res.json({ message: "Provider approved" });

    } catch (err) {
      console.error("Error approving provider:", err);
      res.status(500).json({ error: "Failed to approve provider" });
    }
  });
};
