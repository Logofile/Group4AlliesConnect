import "../App.css";
import { Modal, Table, Alert } from "react-bootstrap";
import { useEffect, useState} from "react";
import axios from "axios";
import AdminDetailsModal from "./AdminDetailsModal";

function PendingOrgsContent() {
    const [pendingOrgs, setPendingOrgs] = useState([]);

    useEffect(() => {
        if (show) {
            fetchPendingOrgs();
        }
    }, [show]);

    const fetchPendingOrgs = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/admin/pending-providers");
            const data = await response.json();
            setPendingOrgs(data);
        } catch (error) {
            console.error("Error fetching pending organizations:", error);
            setStatusMessage("Error fetching pending organizations.");
        }
    };

    const handleApprove = async (orgId) => {
        try {
            await axios.put(`http://localhost:5000/api/admin/providers/${orgId}/approve`, { orgId });
            setStatusMessage("Organization approved successfully.");
            fetchPendingOrgs();
        } catch (error) {
            console.error("Error approving organization:", error);
            setStatusMessage("Error approving organization.");
        }
    };

    const handleReject = async (orgId) => {
        try {
            await axios.put(`http://localhost:5000/api/admin/providers/${orgId}/reject`, {  orgId });
            setStatusMessage("Organization rejected successfully.");
            fetchPendingOrgs();
        } catch (error) {
            console.error("Error rejecting organization:", error);
            setStatusMessage("Error rejecting organization.");
        }
    };

    return (
        <>
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
                                    <button className="outline-warning me-2">View Full Application</button>
                                    <button className="btn-success me-2" onClick={() => handleApprove(org.provider_id)}>
                                        Approve
                                    </button>
                                    <button className="btn-danger" onClick={() => handleReject(org.provider_id)}>
                                        Reject
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tr>
                </tbody>
            </Table>
        </>
    );
}

function EditAccountsContent() {
    return (
        <>
        </>
    );
}

function ManageResourcesContent() {
    return (
        <>
        </>
    );
}

function ManageEventsContent() {
    return (
        <>
        </>
    );
}

function ManageVolunteersContent() {
    return (
        <>
        </>
    );
}

function ReviewLogDataContent() {
    return (
        <>
        </>
    );
}

function ExportLogDataContent() {
    return (
        <>
        </>
    );
}

const MODAL_TYPE = {
    pendingOrgs: {
        title: "Pending Organizations",
        Content: PendingOrgsContent
    },
    editAccounts: {
        title: "Edit Accounts",
        Content: EditAccountsContent
    },
    manageResources: {
        title: "Manage Resources",
        Content: ManageResourcesContent
    },
    manageEvents: {
        title: "Manage Events",
        Content: ManageEventsContent
    },
    manageVolunteers: {
        title: "Manage Volunteers",
        Content: ManageVolunteersContent
    },
    reviewLogData: {
        title: "Review Log Data",
        Content: ReviewLogDataContent
    },
    exportLogData: {
        title: "Export Log Data",
        Content: ExportLogDataContent
    }
};

function AdminModal({ show, onHide, type}) {
    const [statusMessage, setStatusMessage] = useState("");
    const [showAdminDetailsModal, setShowAdminDetailsModal] = useState(false);
    const config = MODAL_TYPE[type];

    return (
        <Modal show={show} className="modal-wide" onHide={onHide}>
            <Modal.Header closeButton>
                <Alert variant="info" className="text-center">
                    {statusMessage}
                </Alert>
                <Modal.Title>{config?.title || ""}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {config && <config.Content />}
            </Modal.Body>
            <AdminDetailsModal show={showAdminDetailsModal} onHide={() => setShowAdminDetailsModal(false)} org={org} />
        </Modal>
    );
}

export default AdminModal;