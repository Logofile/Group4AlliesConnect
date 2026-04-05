import { useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import "../App.css";

function Volunteer({ user, setUser, role, setRole }) {
  const [] = useState(false);

  return (
    <Container className="volunteer-container">
      <div className="text-container mt-5 mb-5">
        <h1>{user?.first_name || "Volunteer"} Dashboard</h1>
      </div>
      <div className="mb-4">
        <h3 className="border-bottom pb-2 mb-3">Manage Volunteer Status</h3>
        <Row className="d-flex">
          <Col md={5} className="d-flex mb-2">
            <button className="btn-gold flex-grow-1">
              Manage Subscribed Organizaitons
            </button>
          </Col>
          <Col md={5} className="d-flex mb-2">
            <button className="btn-white flex-grow-1">Edit Availability</button>
          </Col>
          <Col md={5} className="d-flex mb-2">
            <button className="btn-white flex-grow-1">
              Contact Information
            </button>
          </Col>
        </Row>
      </div>
      <div className="mb-4">
        <h3 className="border-bottom pb-2 mb-3">Signup Management</h3>
        <Row className="d-flex">
          <Col md={5} className="d-flex mb-2">
            <button className="btn-gold flex-grow-1">
              Review Event Signups
            </button>
          </Col>
          <Col md={5} className="d-flex mb-2">
            <button className="btn-gold flex-grow-1">View Shifts</button>
          </Col>
        </Row>
      </div>
      <div className="mb-4">
        <h3 className="border-bottom pb-2 mb-3">Export Volunteer Data</h3>
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

export default Volunteer;
