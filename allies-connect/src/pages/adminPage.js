import { Col, Container, Row , Modal} from "react-bootstrap";
import { useState} from "react";
import "../App.css";
import AdminModal from "../components/AdminModal";

function Admin({ user, setUser , role, setRole }) {
    const [modalType, setModalType] = useState("");

    return (
        <Container className="admin-container">
            <div className="text-container mt-5 mb-5">
                <h1>{user?.first_name || "Admin"} Dashboard</h1>
            </div>
            <div className="mb-4">
                <h3 className="border-bottom pb-2 mb-3">Accounts Management</h3>
                <Row className="d-flex">
                    <Col md={5} className="d-flex mb-2">
                        <button className="btn-gold flex-grow-1" onClick={() => setModalType("pendingOrgs")}>Review Pending Organizations</button>
                    </Col>
                    <Col md={5} className="d-flex mb-2">
                        <button className="btn-white flex-grow-1" onClick={() => setModalType("editAccounts")}>Edit Accounts</button>
                    </Col>
                </Row>            
            </div>
            <div className="mb-4">
                <h3 className="border-bottom pb-2 mb-3">Review Content</h3>
                <Row className="d-flex"> 
                    <Col md={5} className="d-flex mb-2">
                        <button className="btn-gold flex-grow-1" onClick={() => setModalType("manageResources")}>Manage Resources</button>
                    </Col>
                    <Col md={5} className="d-flex mb-2">
                        <button className="btn-gold flex-grow-1" onClick={() => setModalType("manageEvents")}>Manage Events</button>
                    </Col>
                    <Col md={5} className="d-flex mb-2">
                        <button className="btn-gold flex-grow-1" onClick={() => setModalType("manageVolunteers")}>Manage Volunteers</button>
                    </Col>
                </Row>                
            </div>
            <div className="mb-4">
                <h3 className="border-bottom pb-2 mb-3">Reporting</h3>
                <Row className="d-flex">
                    <Col md={5} className="d-flex mb-2">
                        <button className="btn-gold flex-grow-1" onClick={() => setModalType("reviewLogData")}>Review Log Data</button>
                    </Col>
                    <Col md={5} className="d-flex mb-2">
                        <button className="btn-white flex-grow-1" onClick={() => setModalType("exportLogData")}>Export Log Data</button>
                    </Col>
                </Row>    
            </div>
            <AdminModal show={showAdminModal} type={modalType} onHide={() => setModalType("")} />
        </Container>
    );
}

export default Admin;