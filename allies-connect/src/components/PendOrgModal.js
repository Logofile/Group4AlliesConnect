import axios from "axios";
import { useEffect, useState } from "react";
import { Modal, Table } from "react-bootstrap";
import "../App.css";

const API_URL = process.env.REACT_APP_API_URL;

function PendOrgModal({ show, onHide }) {
  const [pendingOrgs, setPendingOrgs] = useState([]);

  useEffect(() => {
    if (show) {
      fetchPendingOrgs();
    }
  }, [show]);

  const fetchPendingOrgs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/pending-providers`);
      const data = await response.json();
      setPendingOrgs(data);
    } catch (error) {
      console.error("Error fetching pending organizations:", error);
    }
  };

  const handleApprove = async (orgId) => {
    try {
      await axios.put(`${API_URL}/api/admin/providers/${orgId}/approve`, {
        orgId,
      });
      fetchPendingOrgs();
    } catch (error) {
      console.error("Error approving organization:", error);
    }
  };

  const handleReject = async (orgId) => {
    try {
      await axios.put(`${API_URL}/api/admin/providers/${orgId}/reject`, {
        orgId,
      });
      fetchPendingOrgs();
    } catch (error) {
      console.error("Error rejecting organization:", error);
    }
  };

  return (
    <Modal show={show} className="modal-wide" onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Pending Organizations</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table hover className="text-center">
          <thead>
            <tr className="text-center">
              <th>Organization</th>
              <th>Email</th>
              <th>Date</th>
              <th>EIN</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-center align-middle">
              {pendingOrgs.map((org) => (
                <tr key={org.provider_id}>
                  <td>{org.name}</td>
                  <td>{org.email}</td>
                  <td>{org.application_date}</td>
                  <td>{org.ein}</td>
                  <td>
                    <button className="outline-warning me-2">
                      View Full Application
                    </button>
                    <button
                      className="btn-success me-2"
                      onClick={() => handleApprove(org.provider_id)}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleReject(org.provider_id)}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tr>
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer></Modal.Footer>
    </Modal>
  );
}

export default PendOrgModal;
