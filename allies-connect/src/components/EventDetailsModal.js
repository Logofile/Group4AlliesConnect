import dayjs from "dayjs";
import { Button, Modal } from "react-bootstrap";
import "../App.css";

function EventDetailsModal({ show, onHide, event }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const role = JSON.parse(localStorage.getItem("role"));
  const isLoggedIn = !!user;
  const isVolunteer = isLoggedIn && role === "volunteer";

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{event ? event.title : "Event Details"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {event && (
          <>
            <div className="text-center mb-3">
              {event.image_url ? (
                <img
                  src={event.image_url}
                  alt={event.title}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "300px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "200px",
                    backgroundColor: "#e9ecef",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "8px",
                  }}
                >
                  <span className="text-muted">No image available</span>
                </div>
              )}
            </div>
            <h5>{event.organization}</h5>
            <p className="text-muted mb-1">
              <strong>Date:</strong>{" "}
              {dayjs(event.startDatetime).format("MMMM D, YYYY")}
            </p>
            <p className="text-muted mb-1">
              <strong>Location:</strong> {event.address}
            </p>
            <p className="text-muted mb-1">
              <strong>Time:</strong>{" "}
              {dayjs(event.startDatetime).format("h:mm A")} &ndash;{" "}
              {dayjs(event.endDatetime).format("h:mm A")}
            </p>
            <hr />
            <div className="d-flex gap-2 mb-3">
              <Button className="btn-gold">Attend Event</Button>
              {isVolunteer && <Button className="btn-gold">Volunteer</Button>}
            </div>
            <hr />
            <p>{event.description || "No description provided."}</p>
          </>
        )}
      </Modal.Body>
      <Modal.Footer></Modal.Footer>
    </Modal>
  );
}

export default EventDetailsModal;
