import { useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import "../App.css";
import ProviderModal from "../components/provider/ProviderModal";

function Provider({ user, setUser, role, setRole }) {
  const [modalType, setModalType] = useState("");

  return (
    <Container className="provider-container">
      <div className="text-container mt-5 mb-5">
        <h1>{user?.first_name || "Provider"} Dashboard</h1>
      </div>
      <div className="mb-4">
        <h3 className="border-bottom pb-2 mb-3">Events</h3>
        <Row className="d-flex">
          <Col md={5} className="d-flex mb-2">
            <button
              className="btn-gold flex-grow-1"
              onClick={() => setModalType("createEvent")}
            >
              Create Event
            </button>
          </Col>
          <Col md={5} className="d-flex mb-2">
            <button
              className="btn-white flex-grow-1"
              onClick={() => setModalType("editEvents")}
            >
              Edit Events
            </button>
          </Col>
        </Row>
      </div>
      <div className="mb-4">
        <h3 className="border-bottom pb-2 mb-3">Resources</h3>
        <Row className="d-flex">
          <Col md={5} className="d-flex mb-2">
            <button
              className="btn-gold flex-grow-1"
              onClick={() => setModalType("createResource")}
            >
              Create Resource
            </button>
          </Col>
          <Col md={5} className="d-flex mb-2">
            <button
              className="btn-white flex-grow-1"
              onClick={() => setModalType("editResources")}
            >
              Edit Resource
            </button>
          </Col>
          <Col md={5} className="d-flex mb-2">
            <button
              className="btn-white flex-grow-1"
              onClick={() => setModalType("volunteerShifts")}
            >
              Volunteer Shift Management
            </button>
          </Col>
        </Row>
      </div>
      <div className="mb-4">
        <h3 className="border-bottom pb-2 mb-3">Reporting</h3>
        <Row className="d-flex">
          <Col md={5} className="d-flex mb-2">
            <button
              className="btn-gold flex-grow-1"
              onClick={() => setModalType("exportHours")}
            >
              Export Volunteer Hours
            </button>
          </Col>
        </Row>
      </div>
      <ProviderModal
        show={!!modalType}
        type={modalType}
        providerId={user?.provider_id}
        userId={user?.user_id}
        onHide={() => setModalType("")}
      />
    </Container>
  );
}

export default Provider;
