import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Alert, Badge, Button, Modal, Spinner, Table } from "react-bootstrap";
import "../App.css";

const API_URL = process.env.REACT_APP_API_URL;

function EventDetailsModal({ show, onHide, event }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const role = JSON.parse(localStorage.getItem("role"));
  const isLoggedIn = !!user;
  const isVolunteer = isLoggedIn && role === "volunteer";
  const userId = user?.user_id;

  // Shift-selection modal
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [signingUp, setSigningUp] = useState(null); // shift_id being signed up for
  const [shiftMsg, setShiftMsg] = useState(null);

  // User's existing signups for this event
  const [mySignups, setMySignups] = useState([]);
  const [loadingSignups, setLoadingSignups] = useState(false);
  const [resigningId, setResigningId] = useState(null);

  // RSVP state
  const [rsvpStatus, setRsvpStatus] = useState(null); // null | "yes" | "no"
  const [rsvpLoading, setRsvpLoading] = useState(false);

  // Fetch user signups whenever the modal opens with an event
  useEffect(() => {
    if (show && event) {
      if (isVolunteer) fetchMySignups();
      if (isLoggedIn) fetchRsvpStatus();
    }
    if (!show) {
      // Reset state when modal closes
      setShowShiftModal(false);
      setShifts([]);
      setShiftMsg(null);
      setRsvpStatus(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, event]);

  const fetchMySignups = async () => {
    if (!event?.id || !userId) return;
    setLoadingSignups(true);
    try {
      const res = await fetch(
        `${API_URL}/api/events/${event.id}/user-signups/${userId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setMySignups(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching user signups:", err);
    } finally {
      setLoadingSignups(false);
    }
  };

  const fetchRsvpStatus = async () => {
    if (!event?.id || !userId) return;
    try {
      const res = await fetch(
        `${API_URL}/api/events/${event.id}/rsvp/${userId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setRsvpStatus(data.rsvp?.status || null);
      }
    } catch (err) {
      console.error("Error fetching RSVP status:", err);
    }
  };

  const handleRsvp = async (status) => {
    if (!event?.id || !userId) return;
    setRsvpLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/events/${event.id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status }),
      });
      if (res.ok) {
        setRsvpStatus(status);
      }
    } catch (err) {
      console.error("Error updating RSVP:", err);
    } finally {
      setRsvpLoading(false);
    }
  };

  const openShiftModal = async () => {
    setShowShiftModal(true);
    setShiftMsg(null);
    setLoadingShifts(true);
    try {
      const res = await fetch(`${API_URL}/api/events/${event.id}/shifts`);
      if (res.ok) {
        const data = await res.json();
        setShifts(Array.isArray(data) ? data : []);
      } else {
        setShifts([]);
      }
    } catch (err) {
      console.error("Error fetching shifts:", err);
      setShifts([]);
    } finally {
      setLoadingShifts(false);
    }
  };

  const handleSignup = async (shiftId) => {
    setSigningUp(shiftId);
    setShiftMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/volunteer-signups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shift_id: shiftId, user_id: userId }),
      });
      if (res.ok) {
        setShiftMsg({ type: "success", text: "Signed up successfully!" });
        // Refresh both lists
        await fetchMySignups();
        const shiftsRes = await fetch(
          `${API_URL}/api/events/${event.id}/shifts`,
        );
        if (shiftsRes.ok) setShifts(await shiftsRes.json());
      } else {
        const err = await res.json();
        setShiftMsg({
          type: "danger",
          text: err.error || "Failed to sign up.",
        });
      }
    } catch (err) {
      console.error("Error signing up:", err);
      setShiftMsg({ type: "danger", text: "Network error." });
    } finally {
      setSigningUp(null);
    }
  };

  const handleResign = async (signupId) => {
    if (!window.confirm("Are you sure you want to resign from this shift?"))
      return;
    setResigningId(signupId);
    try {
      const res = await fetch(`${API_URL}/api/volunteer-signups/${signupId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMySignups((prev) => prev.filter((s) => s.signup_id !== signupId));
      }
    } catch (err) {
      console.error("Error resigning:", err);
    } finally {
      setResigningId(null);
    }
  };

  // IDs of shifts the user is already signed up for
  const myShiftIds = new Set(mySignups.map((s) => s.shift_id));

  // Event is inactive if its end datetime is in the past
  const isInactive = event && dayjs(event.endDatetime).isBefore(dayjs());

  return (
    <>
      <Modal
        show={show}
        onHide={onHide}
        centered
        size="lg"
        enforceFocus={!showShiftModal}
      >
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
                {isLoggedIn ? (
                  rsvpStatus === "yes" ? (
                    <Button
                      variant="success"
                      disabled={rsvpLoading || isInactive}
                      onClick={() => handleRsvp("no")}
                    >
                      ✓ Attending — Cancel RSVP
                    </Button>
                  ) : (
                    <Button
                      className="btn-gold"
                      disabled={rsvpLoading || isInactive}
                      onClick={() => handleRsvp("yes")}
                    >
                      {isInactive
                        ? "Event Ended"
                        : rsvpLoading
                          ? "Saving…"
                          : "Attend Event"}
                    </Button>
                  )
                ) : (
                  <Button className="btn-gold" disabled>
                    Log in to Attend
                  </Button>
                )}
                {isVolunteer && (
                  <Button
                    className="btn-gold"
                    onClick={openShiftModal}
                    disabled={isInactive}
                  >
                    {isInactive ? "Event Ended" : "Volunteer"}
                  </Button>
                )}
              </div>

              {/* ── Show user's registered shifts ── */}
              {isVolunteer && (
                <>
                  {loadingSignups ? (
                    <div className="text-center py-2">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : mySignups.length > 0 ? (
                    <div className="mb-3">
                      <h6>Your Volunteer Shifts</h6>
                      <Table
                        bordered
                        hover
                        size="sm"
                        className="text-center align-middle"
                      >
                        <thead>
                          <tr>
                            <th>Shift Time</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mySignups.map((s) => (
                            <tr key={s.signup_id}>
                              <td>
                                {dayjs(s.start_datetime).format(
                                  "MMM D, YYYY h:mm A",
                                )}{" "}
                                &ndash; {dayjs(s.end_datetime).format("h:mm A")}
                              </td>
                              <td>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  disabled={resigningId === s.signup_id}
                                  onClick={() => handleResign(s.signup_id)}
                                >
                                  {resigningId === s.signup_id
                                    ? "Resigning…"
                                    : "Resign"}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : null}
                </>
              )}

              <hr />
              <p>{event.description || "No description provided."}</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer></Modal.Footer>
      </Modal>

      {/* ── Shift Selection Modal ── */}
      <Modal
        show={showShiftModal}
        onHide={() => setShowShiftModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Select a Volunteer Shift</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {shiftMsg && (
            <Alert
              variant={shiftMsg.type}
              dismissible
              onClose={() => setShiftMsg(null)}
            >
              {shiftMsg.text}
            </Alert>
          )}

          {loadingShifts ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" /> Loading shifts…
            </div>
          ) : shifts.length === 0 ? (
            <p className="text-muted text-center">
              No volunteer shifts are available for this event.
            </p>
          ) : (
            <Table
              bordered
              hover
              size="sm"
              className="text-center align-middle"
            >
              <thead>
                <tr>
                  <th>Shift Time</th>
                  <th>Signed Up</th>
                  <th>Capacity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => {
                  const isFull =
                    shift.capacity != null &&
                    shift.signup_count >= shift.capacity;
                  const alreadySignedUp = myShiftIds.has(shift.shift_id);

                  return (
                    <tr key={shift.shift_id}>
                      <td>
                        {dayjs(shift.start_datetime).format(
                          "MMM D, YYYY h:mm A",
                        )}{" "}
                        &ndash; {dayjs(shift.end_datetime).format("h:mm A")}
                      </td>
                      <td>{shift.signup_count}</td>
                      <td>
                        {shift.capacity != null ? shift.capacity : "No limit"}
                      </td>
                      <td>
                        {alreadySignedUp ? (
                          <Badge bg="success">Signed Up</Badge>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={isFull || signingUp === shift.shift_id}
                            onClick={() => handleSignup(shift.shift_id)}
                          >
                            {signingUp === shift.shift_id
                              ? "Signing up…"
                              : "Sign Up"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowShiftModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default EventDetailsModal;
