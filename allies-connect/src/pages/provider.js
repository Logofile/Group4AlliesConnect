import { useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import "../App.css";

function Provider({ user, setUser, role, setRole }) {
  const [showPendOrgModal, setShowPendOrgModal] = useState(false);

  return (
    <Container className="provider-container">
      <div className="text-container mt-5 mb-5">
        <h1>{user?.first_name || "Provider"} Dashboard</h1>
      </div>
      <div className="mb-4">
        <h3 className="border-bottom pb-2 mb-3">Events</h3>
        <Row className="d-flex">
          <Col md={5} className="d-flex mb-2">
            <button className="btn-gold flex-grow-1">Create Event</button>
          </Col>
          <Col md={5} className="d-flex mb-2">
            <button className="btn-white flex-grow-1">Edit Events</button>
          </Col>
        </Row>
      </div>
      <div className="mb-4">
        <h3 className="border-bottom pb-2 mb-3">Resources</h3>
        <Row className="d-flex">
          <Col md={5} className="d-flex mb-2">
            <button className="btn-gold flex-grow-1">Create Resource</button>
          </Col>
          <Col md={5} className="d-flex mb-2">
            <button className="btn-white flex-grow-1">Edit Resource</button>
          </Col>
          <Col md={5} className="d-flex mb-2">
            <button className="btn-white flex-grow-1">
              Volunteer Shift Management
            </button>
          </Col>
        </Row>
      </div>
      <div className="mb-4">
        <h3 className="border-bottom pb-2 mb-3">Reporting</h3>
        <Row className="d-flex">
          <Col md={5} className="d-flex mb-2">
            <button className="btn-gold flex-grow-1">
              Export Volunteer Hours
            </button>
          </Col>
        </Row>
      </div>
    </Container>
  );
}

export default Provider;
