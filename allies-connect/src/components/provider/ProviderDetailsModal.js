import { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import "../../App.css";

import { DAYS_OF_WEEK, formatHours, TIME_OPTIONS } from "./providerHelpers";

const API_URL = process.env.REACT_APP_API_URL;

function EventDetailsContent({ data }) {
  return (
    <>
      <p>
        <strong>Title:</strong> {data?.title || "N/A"}
      </p>
      <p>
        <strong>Date:</strong> {data?.event_date || "N/A"}
      </p>
      <p>
        <strong>Start:</strong> {data?.start_datetime || "N/A"}
      </p>
      <p>
        <strong>End:</strong> {data?.end_datetime || "N/A"}
      </p>
      <p>
        <strong>Location:</strong>{" "}
        {data?.street_address_1
          ? `${data.street_address_1}, ${data.city}, ${data.state} ${data.zip}`
          : "N/A"}
      </p>
      <p>
        <strong>Category:</strong> {data?.category_name || "N/A"}
      </p>
      <p>
        <strong>Capacity:</strong> {data?.capacity || "N/A"}
      </p>
      <p>
        <strong>Registration Required:</strong>{" "}
        {data?.registration_required || "N/A"}
      </p>
      <p>
        <strong>Description:</strong> {data?.description || "N/A"}
      </p>
      <p>
        <strong>Special Instructions:</strong>{" "}
        {data?.special_instructions || "N/A"}
      </p>
    </>
  );
}

function EditEventDetailsContent({ data, onHide }) {
  const [formData, setFormData] = useState({
    title: "",
    start_datetime: "",
    end_datetime: "",
    description: "",
    capacity: "",
    registration_required: "unknown",
    special_instructions: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setFormData({
        title: data.title || "",
        start_datetime: data.start_datetime
          ? data.start_datetime.replace(" ", "T").slice(0, 16)
          : "",
        end_datetime: data.end_datetime
          ? data.end_datetime.replace(" ", "T").slice(0, 16)
          : "",
        description: data.description || "",
        capacity: data.capacity || "",
        registration_required: data.registration_required || "unknown",
        special_instructions: data.special_instructions || "",
      });
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.title) {
      alert("Title is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        start_datetime: formData.start_datetime
          ? formData.start_datetime.replace("T", " ") + ":00"
          : null,
        end_datetime: formData.end_datetime
          ? formData.end_datetime.replace("T", " ") + ":00"
          : null,
        capacity: formData.capacity ? Number(formData.capacity) : null,
      };
      const response = await fetch(`${API_URL}/api/events/${data.event_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json();
        alert(err.error || "Failed to update event.");
        return;
      }
      alert("Event updated successfully!");
      onHide();
    } catch (err) {
      console.error("Error updating event:", err);
      alert("An error occurred while updating the event.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-3">
        <label className="form-label">
          <strong>Title</strong>
        </label>
        <input
          type="text"
          className="form-control"
          name="title"
          value={formData.title}
          onChange={handleChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>Location</strong>
        </label>
        <input
          type="text"
          className="form-control"
          value={
            data?.street_address_1
              ? `${data.street_address_1}, ${data.city}, ${data.state} ${data.zip}`
              : "N/A"
          }
          readOnly
          disabled
        />
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>Category</strong>
        </label>
        <input
          type="text"
          className="form-control"
          value={data?.category_name || "N/A"}
          readOnly
          disabled
        />
      </div>
      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label">
            <strong>Start</strong>
          </label>
          <input
            type="datetime-local"
            className="form-control"
            name="start_datetime"
            value={formData.start_datetime}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">
            <strong>End</strong>
          </label>
          <input
            type="datetime-local"
            className="form-control"
            name="end_datetime"
            value={formData.end_datetime}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label">
            <strong>Capacity</strong>
          </label>
          <input
            type="number"
            className="form-control"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            min="0"
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">
            <strong>Registration Required</strong>
          </label>
          <select
            className="form-select"
            name="registration_required"
            value={formData.registration_required}
            onChange={handleChange}
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>Description</strong>
        </label>
        <textarea
          className="form-control"
          name="description"
          rows="3"
          value={formData.description}
          onChange={handleChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>Special Instructions</strong>
        </label>
        <textarea
          className="form-control"
          name="special_instructions"
          rows="2"
          value={formData.special_instructions}
          onChange={handleChange}
        />
      </div>
      <button
        type="button"
        className="btn-gold"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </>
  );
}

function ResourceDetailsContent({ data }) {
  return (
    <>
      <p>
        <strong>Name:</strong> {data?.name || "N/A"}
      </p>
      <p>
        <strong>Category:</strong> {data?.category_name || "N/A"}
      </p>
      <p>
        <strong>Location:</strong>{" "}
        {data?.street_address_1
          ? `${data.street_address_1}, ${data.city}, ${data.state} ${data.zip}`
          : "N/A"}
      </p>
      <div>
        <strong>Hours:</strong>
        <pre
          style={{ whiteSpace: "pre-line", margin: 0, fontFamily: "inherit" }}
        >
          {formatHours(data?.hours)}
        </pre>
      </div>
      <p>
        <strong>Description:</strong> {data?.description || "N/A"}
      </p>
      <p>
        <strong>Eligibility:</strong> {data?.eligibility_requirements || "N/A"}
      </p>
    </>
  );
}

function EditResourceDetailsContent({ data, onHide, userId }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    eligibility_requirements: "",
  });
  const [hours, setHours] = useState(() => {
    const init = {};
    DAYS_OF_WEEK.forEach((day, i) => {
      init[day.toLowerCase()] = {
        closed: i >= 5,
        open: i < 5 ? "09:00" : "",
        close: i < 5 ? "17:00" : "",
      };
    });
    return init;
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setFormData({
        name: data.name || "",
        description: data.description || "",
        eligibility_requirements: data.eligibility_requirements || "",
      });
      // Parse existing hours if they are JSON-structured
      if (data.hours) {
        try {
          const parsed =
            typeof data.hours === "string"
              ? JSON.parse(data.hours)
              : data.hours;
          if (typeof parsed === "object" && parsed !== null) {
            setHours(parsed);
          }
        } catch {
          // Not JSON — leave default hours
        }
      }
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleHoursChange = (day, field, value) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleClosedToggle = (day) => {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        closed: !prev[day].closed,
        open: !prev[day].closed ? "" : prev[day].open,
        close: !prev[day].closed ? "" : prev[day].close,
      },
    }));
  };

  const handleSave = async () => {
    if (!formData.name) {
      alert("Name is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        category_id: data.category_id,
        location_id: data.location_id,
        name: formData.name,
        description: formData.description || null,
        hours: JSON.stringify(hours),
        image_url: data.image_url || null,
        eligibility_requirements: formData.eligibility_requirements || null,
      };
      const response = await fetch(
        `${API_URL}/api/resources/${data.resource_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        const err = await response.json();
        alert(err.error || "Failed to update resource.");
        return;
      }
      alert("Resource updated successfully!");
      onHide();
    } catch (err) {
      console.error("Error updating resource:", err);
      alert("An error occurred while updating the resource.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-3">
        <label className="form-label">
          <strong>Name</strong>
        </label>
        <input
          type="text"
          className="form-control"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>Category</strong>
        </label>
        <input
          type="text"
          className="form-control"
          value={data?.category_name || "N/A"}
          readOnly
          disabled
        />
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>Location</strong>
        </label>
        <input
          type="text"
          className="form-control"
          value={
            data?.street_address_1
              ? `${data.street_address_1}, ${data.city}, ${data.state} ${data.zip}`
              : "N/A"
          }
          readOnly
          disabled
        />
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>Days and Hours of Operation</strong>
        </label>
        {DAYS_OF_WEEK.map((day) => {
          const dayKey = day.toLowerCase();
          const dayData = hours[dayKey];
          if (!dayData) return null;
          return (
            <div key={day} className="row align-items-center mb-2">
              <div className="col-3 col-md-2">
                <strong>{day.slice(0, 3)}</strong>
              </div>
              <div className="col-3 col-md-2">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`edit-closed-${dayKey}`}
                    checked={dayData.closed}
                    onChange={() => handleClosedToggle(dayKey)}
                  />
                  <label
                    className="form-check-label"
                    htmlFor={`edit-closed-${dayKey}`}
                  >
                    Closed
                  </label>
                </div>
              </div>
              <div className="col-3 col-md-4">
                <select
                  className="form-select form-select-sm"
                  value={dayData.open}
                  disabled={dayData.closed}
                  onChange={(e) =>
                    handleHoursChange(dayKey, "open", e.target.value)
                  }
                >
                  <option value="">Open</option>
                  {TIME_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-3 col-md-4">
                <select
                  className="form-select form-select-sm"
                  value={dayData.close}
                  disabled={dayData.closed}
                  onChange={(e) =>
                    handleHoursChange(dayKey, "close", e.target.value)
                  }
                >
                  <option value="">Close</option>
                  {TIME_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>Description</strong>
        </label>
        <textarea
          className="form-control"
          name="description"
          rows="3"
          value={formData.description}
          onChange={handleChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>Eligibility Requirements</strong>
        </label>
        <textarea
          className="form-control"
          name="eligibility_requirements"
          rows="2"
          value={formData.eligibility_requirements}
          onChange={handleChange}
        />
      </div>
      <button
        type="button"
        className="btn-gold"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </>
  );
}

function ShiftDetailsContent({ data }) {
  return (
    <>
      <p>
        <strong>Opportunity:</strong> {data?.title || "N/A"}
      </p>
      <p>
        <strong>Provider:</strong> {data?.provider_name || "N/A"}
      </p>
      <p>
        <strong>Status:</strong> {data?.status || "N/A"}
      </p>
      <p>
        <strong>Contact:</strong> {data?.contact_name || "N/A"}
      </p>
      <p>
        <strong>Email:</strong> {data?.contact_email || "N/A"}
      </p>
      <p>
        <strong>Phone:</strong> {data?.contact_phone || "N/A"}
      </p>
    </>
  );
}

function HoursDetailsContent({ data }) {
  return (
    <>
      <p>
        <strong>Opportunity:</strong> {data?.title || "N/A"}
      </p>
      <p>
        <strong>Provider:</strong> {data?.provider_name || "N/A"}
      </p>
      <p>
        <strong>Start:</strong> {data?.start_datetime || "N/A"}
      </p>
      <p>
        <strong>End:</strong> {data?.end_datetime || "N/A"}
      </p>
      <p>
        <strong>Hours Worked:</strong> {data?.hours_worked || "N/A"}
      </p>
    </>
  );
}

const MODAL_TYPE = {
  createEvent: {
    title: "Event Details",
    Content: EventDetailsContent,
  },
  editEvents: {
    title: "Edit Event",
    Content: EditEventDetailsContent,
  },
  createResource: {
    title: "Resource Details",
    Content: ResourceDetailsContent,
  },
  editResources: {
    title: "Edit Resource",
    Content: EditResourceDetailsContent,
  },
  volunteerShifts: {
    title: "Shift Details",
    Content: ShiftDetailsContent,
  },
  exportHours: {
    title: "Volunteer Hours Details",
    Content: HoursDetailsContent,
  },
};

function ProviderDetailsModal({ show, onHide, type, data, userId }) {
  const config = MODAL_TYPE[type];

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{config?.title || ""}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {config && (
          <config.Content data={data} onHide={onHide} userId={userId} />
        )}
      </Modal.Body>
    </Modal>
  );
}

export default ProviderDetailsModal;
