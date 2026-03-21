import { Col, Container, Row } from "react-bootstrap";
import "../App.css";

function Admin({ user, setUser , role, setRole }) {
    return (
        <Container className="admin-container">
            <div className="text-container mt-5 mb-5">
                <h1>{user?.first_name || "Admin"} Dashboard</h1>
            </div>
            <div className="mb-4">
                <h3 className="border-bottom pb-2 mb-3">Accounts Management</h3>
                <Row className="d-flex">
                    <Col md={5} className="d-flex mb-2">
                        <button className="btn-gold flex-grow-1">Review Pending Organizations</button>
                    </Col>
                    <Col md={5} className="d-flex mb-2">
                        <button className="btn-white flex-grow-1">Edit Accounts</button>
                    </Col>
                </Row>            
            </div>
            <div className="mb-4">
                <h3 className="border-bottom pb-2 mb-3">Review Content</h3>
                <Row className="d-flex">
                    <Col md={5} className="d-flex mb-2">
                        <button className="btn-gold flex-grow-1">Manage Resources</button>
                    </Col>
                    <Col md={5} className="d-flex mb-2">
                        <button className="btn-gold flex-grow-1">Manage Events</button>
                    </Col>
                    <Col md={5} className="d-flex mb-2">
                        <button className="btn-gold flex-grow-1">Manage Volunteers</button>
                    </Col>
                </Row>                
            </div>
            <div className="mb-4">
                <h3 className="border-bottom pb-2 mb-3">Reporting</h3>
                <Row className="d-flex">
                    <Col md={5} className="d-flex mb-2">
                        <button className="btn-gold flex-grow-1">Review Metrics</button>
                    </Col>
                    <Col md={5} className="d-flex mb-2">
                        <button className="btn-white flex-grow-1">Export Metric Data</button>
                    </Col>
                </Row>    
            </div>
        </Container>
    );
}

export default Admin;