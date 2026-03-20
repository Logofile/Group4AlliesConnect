import { Col, Container, Form, Row } from "react-bootstrap";
import "../App.css";

function Admin({ user, setUser , role, setRole }) {
    return (
        <div className="text-container mt-5">
            <h1>Admin Dashboard</h1>
            <p>Welcome to the admin dashboard! Here you can manage users, view reports, and update system settings.</p>
        </div>
    );
}

export default Admin;