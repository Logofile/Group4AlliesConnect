import { Modal } from "react-bootstrap";
import "../../App.css";

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
      <p>
        <strong>Hours:</strong> {data?.hours || "N/A"}
      </p>
      <p>
        <strong>Description:</strong> {data?.description || "N/A"}
      </p>
      <p>
        <strong>Eligibility:</strong> {data?.eligibility_requirements || "N/A"}
      </p>
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
    title: "Event Details",
    Content: EventDetailsContent,
  },
  createResource: {
    title: "Resource Details",
    Content: ResourceDetailsContent,
  },
  editResources: {
    title: "Resource Details",
    Content: ResourceDetailsContent,
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

function ProviderDetailsModal({ show, onHide, type, data }) {
  const config = MODAL_TYPE[type];

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{config?.title || ""}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{config && <config.Content data={data} />}</Modal.Body>
    </Modal>
  );
}

export default ProviderDetailsModal;
