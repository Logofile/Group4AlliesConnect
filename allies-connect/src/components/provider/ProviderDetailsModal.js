import { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import "../../App.css";

import { API_URL } from "../../config";
import AddressAutocomplete from "./AddressAutocomplete";
import { DAYS_OF_WEEK, formatHours, TIME_OPTIONS } from "./providerHelpers";
import SocialMediaLinks from "./SocialMediaLinks";

function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

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
    image_url: "",
    flyer_url: "",
  });
  const [saving, setSaving] = useState(false);

  // ── Shift management state ──
  const [shifts, setShifts] = useState([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState(null);
  const [editShiftData, setEditShiftData] = useState({});
  const [savingShiftId, setSavingShiftId] = useState(null);
  const [deletingShiftId, setDeletingShiftId] = useState(null);
  const [showAddShift, setShowAddShift] = useState(false);
  const [newShift, setNewShift] = useState({
    start_datetime: "",
    end_datetime: "",
    capacity: "",
  });
  const [addingShift, setAddingShift] = useState(false);

  const formatShiftDT = (iso) => {
    if (!iso) return "";
    const normalized =
      typeof iso === "string" && iso.indexOf("T") === -1
        ? iso.replace(" ", "T")
        : iso;
    return normalized.slice(0, 16);
  };

  const displayShiftDT = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(
        typeof iso === "string" && iso.indexOf("T") === -1
          ? iso.replace(" ", "T")
          : iso,
      );
      if (isNaN(d)) return iso;
      return d.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

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
        image_url: data.image_url || "",
        flyer_url: data.flyer_url || "",
      });
      fetchShifts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const fetchShifts = async () => {
    if (!data?.event_id) return;
    setLoadingShifts(true);
    try {
      const res = await fetch(`${API_URL}/api/events/${data.event_id}/shifts`);
      if (res.ok) {
        const rows = await res.json();
        setShifts(Array.isArray(rows) ? rows : []);
      }
    } catch (err) {
      console.error("Error fetching shifts:", err);
    } finally {
      setLoadingShifts(false);
    }
  };

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
        image_url: formData.image_url || null,
        flyer_url: formData.flyer_url || null,
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

  // ── Shift CRUD handlers ──
  const startEditShift = (shift) => {
    setEditingShiftId(shift.shift_id);
    setEditShiftData({
      start_datetime: formatShiftDT(shift.start_datetime),
      end_datetime: formatShiftDT(shift.end_datetime),
      capacity: shift.capacity != null ? shift.capacity : "",
    });
  };

  const cancelEditShift = () => {
    setEditingShiftId(null);
    setEditShiftData({});
  };

  const saveEditShift = async (shiftId) => {
    if (!editShiftData.start_datetime || !editShiftData.end_datetime) {
      alert("Start and end times are required.");
      return;
    }
    setSavingShiftId(shiftId);
    try {
      const payload = {
        start_datetime: editShiftData.start_datetime.replace("T", " ") + ":00",
        end_datetime: editShiftData.end_datetime.replace("T", " ") + ":00",
        capacity:
          editShiftData.capacity !== "" && editShiftData.capacity != null
            ? Number(editShiftData.capacity)
            : null,
      };
      const res = await fetch(`${API_URL}/api/shifts/${shiftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to update shift.");
        return;
      }
      setEditingShiftId(null);
      setEditShiftData({});
      await fetchShifts();
    } catch (err) {
      console.error("Error updating shift:", err);
      alert("An error occurred while updating the shift.");
    } finally {
      setSavingShiftId(null);
    }
  };

  const deleteShift = async (shiftId) => {
    if (
      !window.confirm(
        "Delete this shift? Any existing volunteer signups for it will also be removed.",
      )
    )
      return;
    setDeletingShiftId(shiftId);
    try {
      const res = await fetch(`${API_URL}/api/shifts/${shiftId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to delete shift.");
        return;
      }
      await fetchShifts();
    } catch (err) {
      console.error("Error deleting shift:", err);
    } finally {
      setDeletingShiftId(null);
    }
  };

  const handleAddShift = async () => {
    if (!newShift.start_datetime || !newShift.end_datetime) {
      alert("Start and end times are required.");
      return;
    }
    setAddingShift(true);
    try {
      const payload = {
        start_datetime: newShift.start_datetime.replace("T", " ") + ":00",
        end_datetime: newShift.end_datetime.replace("T", " ") + ":00",
        capacity:
          newShift.capacity !== "" && newShift.capacity != null
            ? Number(newShift.capacity)
            : null,
      };
      const res = await fetch(`${API_URL}/api/events/${data.event_id}/shifts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to add shift.");
        return;
      }
      setNewShift({ start_datetime: "", end_datetime: "", capacity: "" });
      setShowAddShift(false);
      await fetchShifts();
    } catch (err) {
      console.error("Error adding shift:", err);
      alert("An error occurred while adding the shift.");
    } finally {
      setAddingShift(false);
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
      <div className="mb-3">
        <label className="form-label">
          <strong>Image URL</strong>
        </label>
        <input
          type="url"
          className="form-control"
          name="image_url"
          placeholder="https://example.com/image.jpg"
          value={formData.image_url}
          onChange={handleChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>Flyer URL</strong>
        </label>
        <input
          type="url"
          className="form-control"
          name="flyer_url"
          placeholder="https://example.com/flyer.pdf"
          value={formData.flyer_url}
          onChange={handleChange}
        />
      </div>

      {/* ── Volunteer Shifts ── */}
      <hr />
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <label className="form-label mb-0">
            <strong>Volunteer Shifts</strong>
          </label>
          {!showAddShift && (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => setShowAddShift(true)}
            >
              + Add Shift
            </button>
          )}
        </div>

        {loadingShifts ? (
          <p className="text-muted">Loading shifts…</p>
        ) : shifts.length === 0 && !showAddShift ? (
          <p className="text-muted">No volunteer shifts for this event.</p>
        ) : (
          <table className="table table-bordered table-sm text-center align-middle">
            <thead>
              <tr>
                <th>Start</th>
                <th>End</th>
                <th>Capacity</th>
                <th>Signed Up</th>
                <th style={{ width: "140px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => {
                const isEditing = editingShiftId === shift.shift_id;
                return (
                  <tr key={shift.shift_id}>
                    {isEditing ? (
                      <>
                        <td>
                          <input
                            type="datetime-local"
                            className="form-control form-control-sm"
                            value={editShiftData.start_datetime}
                            onChange={(e) =>
                              setEditShiftData((prev) => ({
                                ...prev,
                                start_datetime: e.target.value,
                              }))
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="datetime-local"
                            className="form-control form-control-sm"
                            value={editShiftData.end_datetime}
                            onChange={(e) =>
                              setEditShiftData((prev) => ({
                                ...prev,
                                end_datetime: e.target.value,
                              }))
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            min="0"
                            placeholder="No limit"
                            value={editShiftData.capacity}
                            onChange={(e) =>
                              setEditShiftData((prev) => ({
                                ...prev,
                                capacity: e.target.value,
                              }))
                            }
                          />
                        </td>
                        <td>{shift.signup_count}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-success me-1"
                            disabled={savingShiftId === shift.shift_id}
                            onClick={() => saveEditShift(shift.shift_id)}
                          >
                            {savingShiftId === shift.shift_id ? "…" : "Save"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={cancelEditShift}
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{displayShiftDT(shift.start_datetime)}</td>
                        <td>{displayShiftDT(shift.end_datetime)}</td>
                        <td>
                          {shift.capacity != null ? shift.capacity : "No limit"}
                        </td>
                        <td>{shift.signup_count}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => startEditShift(shift)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            disabled={deletingShiftId === shift.shift_id}
                            onClick={() => deleteShift(shift.shift_id)}
                          >
                            {deletingShiftId === shift.shift_id
                              ? "…"
                              : "Delete"}
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* ── Add new shift form ── */}
        {showAddShift && (
          <div className="border rounded p-3 mb-2">
            <h6 className="mb-2">New Shift</h6>
            <div className="row mb-2">
              <div className="col-md-5">
                <label className="form-label form-label-sm">Start</label>
                <input
                  type="datetime-local"
                  className="form-control form-control-sm"
                  value={newShift.start_datetime}
                  onChange={(e) =>
                    setNewShift((prev) => ({
                      ...prev,
                      start_datetime: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-md-5">
                <label className="form-label form-label-sm">End</label>
                <input
                  type="datetime-local"
                  className="form-control form-control-sm"
                  value={newShift.end_datetime}
                  onChange={(e) =>
                    setNewShift((prev) => ({
                      ...prev,
                      end_datetime: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-md-2">
                <label className="form-label form-label-sm">Capacity</label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  min="0"
                  placeholder="∞"
                  value={newShift.capacity}
                  onChange={(e) =>
                    setNewShift((prev) => ({
                      ...prev,
                      capacity: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-success"
                disabled={addingShift}
                onClick={handleAddShift}
              >
                {addingShift ? "Adding…" : "Add Shift"}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setShowAddShift(false);
                  setNewShift({
                    start_datetime: "",
                    end_datetime: "",
                    capacity: "",
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      <hr />

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
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    street_address: "",
    city: "",
    state: "GA",
    zip: "",
    latitude: null,
    longitude: null,
    description: "",
    eligibility_requirements: "",
    contact_phone: "",
    languages_spoken: "",
    website: "",
    image_url: "",
    social_media_links: [],
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
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/categories`);
        const rows = await response.json();
        setCategories(Array.isArray(rows) ? rows : []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (data) {
      let parsedSocialMediaLinks = [];
      if (data.social_media_links) {
        try {
          parsedSocialMediaLinks =
            typeof data.social_media_links === "string"
              ? JSON.parse(data.social_media_links)
              : data.social_media_links;
        } catch {
          parsedSocialMediaLinks = [];
        }
      }

      setFormData({
        name: data.name || "",
        street_address: data.street_address_1 || "",
        city: data.city || "",
        state: data.state || "GA",
        zip: data.zip || "",
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        description: data.description || "",
        eligibility_requirements: data.eligibility_requirements || "",
        contact_phone: formatPhone(data.contact_phone || ""),
        languages_spoken: data.languages_spoken || "",
        website: data.website || "",
        image_url: data.image_url || "",
        social_media_links: Array.isArray(parsedSocialMediaLinks)
          ? parsedSocialMediaLinks
          : [],
      });
      setSelectedCategories(
        data.category_id
          ? [
              {
                category_id: data.category_id,
                name: data.category_name || "",
                type: "resource",
              },
            ]
          : [],
      );
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
    setFormData((prev) => ({
      ...prev,
      [name]: name === "contact_phone" ? formatPhone(value) : value,
    }));
  };

  const handleAddressSelect = (addressData) => {
    setFormData((prev) => ({
      ...prev,
      street_address: addressData.street_address,
      city: addressData.city,
      state: addressData.state,
      zip: addressData.zip,
      latitude: addressData.latitude,
      longitude: addressData.longitude,
    }));
  };

  const handleAddCategory = (e) => {
    const categoryId = e.target.value;
    if (!categoryId) return;
    const category = categories.find(
      (item) => String(item.category_id) === String(categoryId),
    );
    if (
      category &&
      !selectedCategories.find(
        (item) => item.category_id === category.category_id,
      )
    ) {
      setSelectedCategories((prev) => [...prev, category]);
    }
    e.target.value = "";
  };

  const handleRemoveCategory = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.filter((item) => item.category_id !== categoryId),
    );
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
    if (
      !formData.name ||
      !formData.street_address ||
      !formData.city ||
      !formData.state ||
      !formData.zip
    ) {
      alert("Please fill in all required fields.");
      return;
    }
    if (selectedCategories.length === 0) {
      alert("Please select at least one resource type.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        category_id: selectedCategories[0].category_id,
        street_address: formData.street_address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        latitude: formData.latitude,
        longitude: formData.longitude,
        name: formData.name,
        description: formData.description || null,
        hours: JSON.stringify(hours),
        image_url: formData.image_url || null,
        eligibility_requirements: formData.eligibility_requirements || null,
        contact_phone: formData.contact_phone || null,
        languages_spoken: formData.languages_spoken || null,
        website: formData.website || null,
        social_media_links:
          formData.social_media_links.length > 0
            ? JSON.stringify(formData.social_media_links)
            : null,
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
          <strong>
            Type of Resource <span className="text-danger">*</span>
          </strong>
        </label>
        {selectedCategories.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mb-2">
            {selectedCategories.map((category) => (
              <span
                key={category.category_id}
                className="badge rounded-pill d-flex align-items-center"
                style={{
                  backgroundColor: "#c5a24d",
                  color: "#fff",
                  fontSize: "0.9rem",
                  padding: "0.4em 0.8em",
                }}
              >
                {category.name}
                <button
                  type="button"
                  className="btn-close btn-close-white ms-2"
                  style={{ fontSize: "0.6rem" }}
                  onClick={() => handleRemoveCategory(category.category_id)}
                  aria-label="Remove"
                />
              </span>
            ))}
          </div>
        )}
        <select
          className="form-select"
          onChange={handleAddCategory}
          defaultValue=""
        >
          <option value="">Select resource type(s)</option>
          {categories
            .filter(
              (category) =>
                (category.type === "resource" || category.type === "both") &&
                !selectedCategories.find(
                  (selected) => selected.category_id === category.category_id,
                ),
            )
            .map((category) => (
              <option key={category.category_id} value={category.category_id}>
                {category.name}
              </option>
            ))}
        </select>
      </div>

      <AddressAutocomplete
        formData={formData}
        onChange={handleChange}
        onAddressSelect={handleAddressSelect}
      />
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
      <div className="mb-3">
        <label className="form-label">
          <strong>Phone Number</strong>
        </label>
        <input
          type="tel"
          className="form-control"
          name="contact_phone"
          placeholder="(555) 555-5555"
          value={formData.contact_phone}
          onChange={handleChange}
          inputMode="tel"
          maxLength={14}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>Languages</strong>
        </label>
        <input
          type="text"
          className="form-control"
          name="languages_spoken"
          placeholder="e.g. English, Spanish"
          value={formData.languages_spoken}
          onChange={handleChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>Website URL</strong>
        </label>
        <input
          type="url"
          className="form-control"
          name="website"
          placeholder="https://example.org"
          value={formData.website}
          onChange={handleChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>Social Media Links</strong>
        </label>
        <SocialMediaLinks
          links={formData.social_media_links}
          onChange={(val) =>
            setFormData((prev) => ({ ...prev, social_media_links: val }))
          }
        />
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>Image URL</strong>
        </label>
        <input
          type="url"
          className="form-control"
          name="image_url"
          placeholder="https://example.com/image.jpg"
          value={formData.image_url}
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
