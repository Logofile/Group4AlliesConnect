import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button, Col, Image, Modal, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

function MapPinDetails({ details }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const role = JSON.parse(localStorage.getItem("role"));
  const isVolunteer = !!user && role === "volunteer";

  const [showStopModal, setShowStopModal] = useState(false);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [activeConnectionId, setActiveConnectionId] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const isResource = details?.type === "Resource";

  // Check volunteer status whenever the resource details change
  useEffect(() => {
    const checkConnection = async () => {
      if (!isVolunteer || !details?.resource_id || !user?.user_id) return;
      try {
        const res = await axios.get(`${API_URL}/api/resource-connections`, {
          params: { resource_id: details.resource_id, user_id: user.user_id },
        });
        if (res.data && res.data.active) {
          setIsRegistered(true);
          setActiveConnectionId(res.data.connection_id);
        } else {
          setIsRegistered(false);
          setActiveConnectionId(null);
        }
      } catch (err) {
        console.error("Error checking resource connection:", err);
      }
    };
    checkConnection();
  }, [details?.resource_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVolunteerClick = async () => {
    if (!details?.resource_id || !user?.user_id) return;

    // Already registered → prompt to stop
    if (isRegistered) {
      setShowStopModal(true);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/resource-connections`, {
        resource_id: details.resource_id,
        user_id: user.user_id,
      });

      if (res.data.already_active) {
        setActiveConnectionId(res.data.connection_id);
        setIsRegistered(true);
        setShowStopModal(true);
      } else if (res.data.created || res.data.activated) {
        setActiveConnectionId(res.data.connection_id);
        setIsRegistered(true);
        alert("You are now volunteering with this resource!");
      }
    } catch (err) {
      console.error("Error connecting to resource:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStopVolunteering = async () => {
    if (!activeConnectionId) return;
    try {
      await axios.put(
        `${API_URL}/api/resource-connections/${activeConnectionId}/deactivate`,
      );
      setShowStopModal(false);
      setActiveConnectionId(null);
      setIsRegistered(false);
      alert("You have stopped volunteering with this resource.");
    } catch (err) {
      console.error("Error deactivating connection:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  if (!details) return null;

  const renderDetailRow = (label, content) => (
    <div>
      <strong>{label}:</strong> {content}
    </div>
  );

  const websiteUrl = details.website?.trim();
  const languageList = Array.isArray(details.languages)
    ? details.languages.filter(Boolean)
    : [];
  const socialMediaLinks = Array.isArray(details.socialMedia)
    ? details.socialMedia.filter(
        (entry) => (entry?.url || entry?.link || "").trim().length > 0,
      )
    : [];

  return (
    <div
      style={{
        padding: "5px",
        fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        maxWidth: "650px",
        width: "100%",
      }}
    >
      {details.type && (
        <h6
          style={{
            marginBottom: "4px",
            color: "#888",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            fontSize: "12px",
          }}
        >
          {details.type}
        </h6>
      )}
      <h4 style={{ marginBottom: "15px", color: "#333", fontWeight: "500" }}>
        {details.name}
      </h4>

      <Row>
        <Col
          xs={12}
          md={4}
          style={{ paddingRight: "10px", marginBottom: "15px" }}
        >
          <div
            style={{
              height: "100%",
              minHeight: "180px",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            {/* TODO: Uses a static placeholder image for the time being */}
            <Image
              src={
                details.image ||
                "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=500&q=80"
              }
              alt={details.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </Col>
        {/* Wraps the text always for small screens, and puts the text to the right on larger screens */}
        <Col xs={12} md={8} style={{ paddingLeft: "10px" }}>
          <div style={{ fontSize: "13px", lineHeight: "1.4", color: "#444" }}>
            {details.address && (
              <div>
                <strong>Address:</strong> {details.address}
              </div>
            )}
            {details.eventDateTime && (
              <div>
                <strong>Date &amp; Time:</strong>
                <br />
                <span style={{ whiteSpace: "pre-line" }}>
                  {details.eventDateTime}
                </span>
              </div>
            )}
            {details.hours && (
              <div>
                <strong>Hours:</strong>
                <br />
                <span
                  style={{
                    whiteSpace: "pre-line",
                    fontSize: "12px",
                    lineHeight: "1.2",
                  }}
                >
                  {details.hours}
                </span>
              </div>
            )}
            {isResource
              ? renderDetailRow("Phone", details.phone || "Not listed")
              : details.phone && (
                  <div>
                    <strong>Phone:</strong> {details.phone}
                  </div>
                )}
            {isResource
              ? renderDetailRow(
                  "Website",
                  websiteUrl ? (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#0097a7" }}
                    >
                      {details.website_display || websiteUrl}
                    </a>
                  ) : (
                    "Not listed"
                  ),
                )
              : websiteUrl && (
                  <div>
                    <strong>Website:</strong>{" "}
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#0097a7" }}
                    >
                      {details.website_display || websiteUrl}
                    </a>
                  </div>
                )}
            {isResource
              ? renderDetailRow(
                  "Languages",
                  languageList.length > 0
                    ? languageList.join(", ")
                    : "Not listed",
                )
              : languageList.length > 0 && (
                  <div>
                    <strong>Languages:</strong> {languageList.join(", ")}
                  </div>
                )}
            {isResource
              ? renderDetailRow(
                  "Social Media",
                  socialMediaLinks.length > 0 ? (
                    <>
                      {socialMediaLinks.map((sm, i) => {
                        const url = sm.url || sm.link;
                        return (
                          <React.Fragment key={`${sm.name}-${url}`}>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#0097a7",
                                textDecoration: "underline",
                              }}
                            >
                              {sm.name}
                            </a>
                            {i < socialMediaLinks.length - 1 ? ", " : ""}
                          </React.Fragment>
                        );
                      })}
                    </>
                  ) : (
                    "Not listed"
                  ),
                )
              : socialMediaLinks.length > 0 && (
                  <div>
                    <strong>Social Media:</strong>{" "}
                    {socialMediaLinks.map((sm, i) => {
                      const url = sm.url || sm.link;
                      return (
                        <React.Fragment key={`${sm.name}-${url}`}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#0097a7",
                              textDecoration: "underline",
                            }}
                          >
                            {sm.name}
                          </a>
                          {i < socialMediaLinks.length - 1 ? ", " : ""}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
          </div>

          <div className="mt-3">
            {details.flyer_url && (
              <div className="mb-2">
                <Button
                  variant="outline-info"
                  href={details.flyer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  style={{
                    width: "100%",
                    borderRadius: "20px",
                    fontSize: "12px",
                    padding: "6px 15px",
                    borderColor: "#0097a7",
                    color: "#0097a7",
                    backgroundColor: "transparent",
                  }}
                >
                  Download Flyer
                </Button>
              </div>
            )}
            <div className="d-flex mb-2" style={{ gap: "10px" }}>
              {/* TODO: Make the buttons go to a page */}
              {details.type === "Resource" && (
                <Button
                  variant="outline-info"
                  onClick={() => setShowEligibilityModal(true)}
                  style={{
                    flex: 1,
                    borderRadius: "20px",
                    fontSize: "12px",
                    padding: "6px 15px",
                    borderColor: "#0097a7",
                    color: "#0097a7",
                    backgroundColor: "transparent",
                  }}
                >
                  Eligibility Requirements
                </Button>
              )}
              {details.type === "Event" ? (
                <Button
                  variant="info"
                  onClick={() => {
                    navigate(`/events?eventId=${details.event_id}`);
                  }}
                  style={{
                    flex: 1,
                    borderRadius: "20px",
                    fontSize: "12px",
                    padding: "6px 15px",
                    backgroundColor: "#0097a7",
                    borderColor: "#0097a7",
                    color: "white",
                  }}
                >
                  See More Info
                </Button>
              ) : (
                <Button
                  variant="info"
                  onClick={() => {
                    const orgName = details.provider_name || details.name;
                    navigate(`/events?org=${encodeURIComponent(orgName)}`);
                  }}
                  style={{
                    flex: 1,
                    borderRadius: "20px",
                    fontSize: "12px",
                    padding: "6px 15px",
                    backgroundColor: "#0097a7",
                    borderColor: "#0097a7",
                    color: "white",
                  }}
                >
                  Upcoming Events
                </Button>
              )}
            </div>
            {isVolunteer && (
              <Button
                variant={isRegistered ? "info" : "outline-info"}
                disabled={loading}
                onClick={handleVolunteerClick}
                style={{
                  width: "100%",
                  borderRadius: "20px",
                  fontSize: "12px",
                  padding: "6px 15px",
                  borderColor: "#0097a7",
                  color: isRegistered ? "white" : "#0097a7",
                  backgroundColor: isRegistered ? "#0097a7" : "transparent",
                }}
              >
                {loading
                  ? "Processing…"
                  : isRegistered
                    ? "Registered as Volunteer"
                    : "Volunteer With This Resource"}
              </Button>
            )}

            {/* Stop-volunteering confirmation modal */}
            <Modal
              show={showStopModal}
              onHide={() => setShowStopModal(false)}
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title>Already Volunteering</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                You are already volunteering with this resource. Would you like
                to stop volunteering?
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  onClick={() => setShowStopModal(false)}
                >
                  Dismiss
                </Button>
                <Button variant="danger" onClick={handleStopVolunteering}>
                  Stop Volunteering
                </Button>
              </Modal.Footer>
            </Modal>

            {/* Eligibility requirements modal */}
            <Modal
              show={showEligibilityModal}
              onHide={() => setShowEligibilityModal(false)}
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title>Eligibility Requirements</Modal.Title>
              </Modal.Header>
              <Modal.Body style={{ whiteSpace: "pre-line", fontSize: "14px" }}>
                {details.eligibility_requirements?.trim()
                  ? details.eligibility_requirements
                  : "No eligibility requirements were provided for this resource."}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  onClick={() => setShowEligibilityModal(false)}
                >
                  Close
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
        </Col>
      </Row>

      {details.description && (
        <div className="mt-4">
          <h5
            style={{
              fontSize: "18px",
              marginBottom: "8px",
              color: "#333",
              fontWeight: "400",
            }}
          >
            About Us
          </h5>
          <p style={{ fontSize: "14px", color: "#333", lineHeight: "1.5" }}>
            {details.description}
          </p>
        </div>
      )}
    </div>
  );
}

export default MapPinDetails;
