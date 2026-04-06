import { useEffect, useState } from "react";
import "../../App.css";
import ShiftBuilder from "./ShiftBuilder";
import { API_URL, TIME_OPTIONS } from "./providerHelpers";

function CreateEventContent({ onViewDetails, providerId }) {
  const [categories, setCategories] = useState([]);
  const [provider, setProvider] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    provider_id: providerId || "",
    street_address: "",
    city: "",
    state: "",
    zip: "",
    event_date: "",
    start_time: "",
    end_time: "",
    description: "",
    image: null,
    flyer: null,
  });
  const [timeError, setTimeError] = useState("");
  const [shifts, setShifts] = useState([]);

  // Reset shifts to a single shift whenever event start/end times change
  useEffect(() => {
    if (
      formData.start_time &&
      formData.end_time &&
      formData.end_time > formData.start_time
    ) {
      setShifts([{ start: formData.start_time, end: formData.end_time }]);
    } else {
      setShifts([]);
    }
  }, [formData.start_time, formData.end_time]);

  useEffect(() => {
    fetchCategories();
    if (providerId) {
      fetchProvider();
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories`);
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProvider = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/organizations/profile/${providerId}`,
      );
      const data = await response.json();
      setProvider(data);
      setFormData((prev) => ({ ...prev, provider_id: data.provider_id }));
    } catch (error) {
      console.error("Error fetching provider:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "start_time" || name === "end_time") {
        if (
          updated.start_time &&
          updated.end_time &&
          updated.end_time <= updated.start_time
        ) {
          setTimeError("End time must be after start time.");
        } else {
          setTimeError("");
        }
      }
      return updated;
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData((prev) => ({ ...prev, [name]: files[0] || null }));
  };

  const handleAddCategory = (e) => {
    const categoryId = e.target.value;
    if (!categoryId) return;
    const category = categories.find(
      (c) => String(c.category_id) === String(categoryId),
    );
    if (
      category &&
      !selectedCategories.find((c) => c.category_id === category.category_id)
    ) {
      setSelectedCategories((prev) => [...prev, category]);
    }
    e.target.value = "";
  };

  const handleRemoveCategory = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.filter((c) => c.category_id !== categoryId),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.title ||
      !formData.provider_id ||
      !formData.street_address ||
      !formData.city ||
      !formData.state ||
      !formData.zip ||
      !formData.event_date ||
      !formData.start_time ||
      !formData.end_time
    ) {
      alert("Please fill in all required fields.");
      return;
    }
    if (formData.end_time <= formData.start_time) {
      setTimeError("End time must be after start time.");
      return;
    }
    if (selectedCategories.length === 0) {
      alert("Please select at least one event type.");
      return;
    }

    // Bundle all form data for the backend
    const startDatetime = `${formData.event_date} ${formData.start_time}:00`;
    const endDatetime = `${formData.event_date} ${formData.end_time}:00`;

    const eventShifts = shifts.map((shift, index) => ({
      shift_number: index + 1,
      start_time: `${formData.event_date} ${shift.start}:00`,
      end_time: `${formData.event_date} ${shift.end}:00`,
    }));

    const payload = {
      title: formData.title,
      provider_id: formData.provider_id,
      street_address: formData.street_address,
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
      event_date: formData.event_date,
      start_datetime: startDatetime,
      end_datetime: endDatetime,
      description: formData.description,
      category_ids: selectedCategories.map((c) => c.category_id),
      shifts: eventShifts,
    };

    try {
      const response = await fetch(`${API_URL}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        alert(err.error || "Failed to create event.");
        return;
      }

      alert("Event created successfully!");
      // Reset form
      setFormData({
        title: "",
        provider_id: providerId || "",
        street_address: "",
        city: "",
        state: "",
        zip: "",
        event_date: "",
        start_time: "",
        end_time: "",
        description: "",
        image: null,
        flyer: null,
      });
      setSelectedCategories([]);
      setShifts([]);
    } catch (err) {
      console.error("Error creating event:", err);
      alert("An error occurred while creating the event.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">
          <strong>
            Event Name <span className="text-danger">*</span>
          </strong>
        </label>
        <input
          type="text"
          className="form-control"
          name="title"
          placeholder="Enter event name"
          value={formData.title}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>
            Event Sponsor <span className="text-danger">*</span>
          </strong>
        </label>
        <input
          type="text"
          className="form-control"
          value={provider?.name || "Loading..."}
          readOnly
        />
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>
            Street Address <span className="text-danger">*</span>
          </strong>
        </label>
        <input
          type="text"
          className="form-control"
          name="street_address"
          placeholder="Enter street address"
          value={formData.street_address}
          onChange={handleChange}
          required
        />
      </div>
      <div className="row mb-3">
        <div className="col-md-5">
          <label className="form-label">
            <strong>
              City <span className="text-danger">*</span>
            </strong>
          </label>
          <input
            type="text"
            className="form-control"
            name="city"
            placeholder="City"
            value={formData.city}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">
            <strong>
              State <span className="text-danger">*</span>
            </strong>
          </label>
          <input
            type="text"
            className="form-control"
            name="state"
            placeholder="State"
            value={formData.state}
            onChange={handleChange}
            maxLength={2}
            required
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">
            <strong>
              Zip Code <span className="text-danger">*</span>
            </strong>
          </label>
          <input
            type="text"
            className="form-control"
            name="zip"
            placeholder="Zip Code"
            value={formData.zip}
            onChange={handleChange}
            maxLength={9}
            required
          />
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>
            Date <span className="text-danger">*</span>
          </strong>
        </label>
        <input
          type="date"
          className="form-control"
          name="event_date"
          value={formData.event_date}
          onChange={handleChange}
          required
        />
      </div>
      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label">
            <strong>
              Time Start <span className="text-danger">*</span>
            </strong>
          </label>
          <select
            className="form-select"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
            required
          >
            <option value="">Select start time</option>
            {TIME_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">
            <strong>
              Time End <span className="text-danger">*</span>
            </strong>
          </label>
          <select
            className="form-select"
            name="end_time"
            value={formData.end_time}
            onChange={handleChange}
            required
          >
            <option value="">Select end time</option>
            {TIME_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {timeError && (
        <div className="text-danger mb-3" style={{ marginTop: "-0.75rem" }}>
          {timeError}
        </div>
      )}
      <ShiftBuilder
        startTime={formData.start_time}
        endTime={formData.end_time}
        shifts={shifts}
        onShiftsChange={setShifts}
      />
      <div className="mb-3">
        <label className="form-label">
          <strong>
            Type of Event <span className="text-danger">*</span>
          </strong>
        </label>
        {selectedCategories.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mb-2">
            {selectedCategories.map((cat) => (
              <span
                key={cat.category_id}
                className="badge rounded-pill d-flex align-items-center"
                style={{
                  backgroundColor: "#c5a24d",
                  color: "#fff",
                  fontSize: "0.9rem",
                  padding: "0.4em 0.8em",
                }}
              >
                {cat.name}
                <button
                  type="button"
                  className="btn-close btn-close-white ms-2"
                  style={{ fontSize: "0.6rem" }}
                  onClick={() => handleRemoveCategory(cat.category_id)}
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
          <option value="">Select event type(s)</option>
          {categories
            .filter(
              (cat) =>
                !selectedCategories.find(
                  (sc) => sc.category_id === cat.category_id,
                ),
            )
            .map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.name}
              </option>
            ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>Event Description</strong>
        </label>
        <textarea
          className="form-control"
          name="description"
          rows="3"
          placeholder="Describe the event..."
          value={formData.description}
          onChange={handleChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>Event Image</strong>
        </label>
        <input
          type="file"
          className="form-control"
          name="image"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">
          <strong>Event Flyer</strong>
        </label>
        <input
          type="file"
          className="form-control"
          name="flyer"
          accept="image/*,.pdf"
          onChange={handleFileChange}
        />
      </div>
      <button type="submit" className="btn-gold">
        Create Event
      </button>
    </form>
  );
}

export default CreateEventContent;
