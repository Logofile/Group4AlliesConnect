import "../App.css";
import { Modal, Table} from "react-bootstrap";
import { useEffect, useState} from "react";
import axios from "axios";
import AdminDetailsModal from "./AdminDetailsModal";

function PendingOrgsContent({ onViewDetails }) {
    const [pendingOrgs, setPendingOrgs] = useState([]);

    useEffect(() => {
        fetchPendingOrgs();
    }, []);

    const fetchPendingOrgs = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/admin/pending-providers");
            const data = await response.json();
            setPendingOrgs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching pending organizations:", error);
            alert("Error fetching pending organizations.");
            setPendingOrgs([]);
        }
    };

    const handleApprove = async (orgId) => {
        try {
            await axios.put(`http://localhost:5000/api/admin/providers/${orgId}/approve`, { orgId });
            alert("Organization approved successfully.");
            fetchPendingOrgs();
        } catch (error) {
            console.error("Error approving organization:", error);
            alert("Error approving organization.");
        }
    };

    const handleReject = async (orgId) => {
        try {
            await axios.put(`http://localhost:5000/api/admin/providers/${orgId}/reject`, {  orgId });
            alert("Organization rejected successfully.");
            fetchPendingOrgs();
        } catch (error) {
            console.error("Error rejecting organization:", error);
            alert("Error rejecting organization.");
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
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {pendingOrgs.map((org) => (
                        <tr key={org.provider_id} className="text-center align-middle">
                            <td>{org.name}</td>
                            <td>{org.email}</td>
                            <td>{org.application_date}</td>
                            <td>{org.ein}</td>
                            <td>
                                <button className="outline-warning me-2" onClick={() => onViewDetails("pendingOrgs", org)}>
                                    View Full Application
                                </button>
                                <button className="btn-success me-2" onClick={() => handleApprove(org.provider_id)}>
                                    Approve
                                </button>
                                <button className="btn-danger" onClick={() => handleReject(org.provider_id)}>
                                    Reject
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </>
    );
}

function EditAccountsContent({ onViewDetails }) {
    const [accounts, setAccounts] = useState([]);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/admin/accounts");
            const data = await response.json();
            setAccounts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching accounts:", error);
            alert("Error fetching accounts.");
            setAccounts([]);
        }
    };

    return (
        <>
            <Table hover className="text-center">
                <thead>
                    <tr className="text-center">
                        <th>Name</th>
                        <th>Email</th>
                        <th>Roles</th>
                        <th>Date Created</th>
                        <th>Date Updated</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {accounts.map((account) => (
                        <tr key={account.username} className="text-center align-middle">
                            <td>{account.name}</td>
                            <td>{account.email}</td>
                            <td>{account.roles}</td>
                            <td>{account.date_created}</td>
                            <td>{account.date_updated}</td>
                            <td>
                                <button className="outline-warning me-2" onClick={() => onViewDetails("editAccounts", account)}>
                                    View Account Details
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </>
    );
}

function ManageResourcesContent({ onViewDetails }) {
    const [resources, setResources] = useState([]);

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/admin/resources");
            const data = await response.json();
            setResources(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching resources:", error);
            alert("Error fetching resources.");
            setResources([]);
        }
    };

    return (
        <>
            <Table hover className="text-center">
                <thead>
                    <tr className="text-center">
                        <th>Name</th>
                        <th>Location</th>
                        <th>Organization</th>
                        <th>Date Created</th>
                        <th>Date Updated</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {resources.map((resource) => (
                        <tr key={resource.id} className="text-center align-middle">
                            <td>{resource.name}</td>
                            <td>{resource.location}</td>
                            <td>{resource.organization}</td>
                            <td>{resource.date_created}</td>
                            <td>{resource.date_updated}</td>
                            <td>
                                <button className="outline-warning me-2" onClick={() => onViewDetails("editResources", resource)}>
                                    View Resource Details
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </>
    );
}

function ManageEventsContent({ onViewDetails }) {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/admin/events");
            const data = await response.json();
            setEvents(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching events:", error);
            alert("Error fetching events.");
            setEvents([]);
        }
    };

    return (
        <>
            <Table hover className="text-center">
                <thead>
                    <tr className="text-center">
                        <th>Name</th>
                        <th>Location</th>
                        <th>Organization</th>
                        <th>Date Created</th>
                        <th>Date Updated</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {events.map((event) => (
                        <tr key={event.id} className="text-center align-middle">
                            <td>{event.name}</td>
                            <td>{event.location}</td>
                            <td>{event.organization}</td>
                            <td>{event.date_created}</td>
                            <td>{event.date_updated}</td>
                            <td>
                                <button className="outline-warning me-2" onClick={() => onViewDetails("editEvents", event)}>
                                    View Event Details
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </>
    );
}

function ManageVolunteersContent({ onViewDetails }) {
    const [volunteers, setVolunteers] = useState([]);

    useEffect(() => {
        fetchVolunteers();
    }, []);

    const fetchVolunteers = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/admin/volunteers");
            const data = await response.json();
            setVolunteers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching volunteers:", error);
            alert("Error fetching volunteers.");
            setVolunteers([]);
        }
    };

    return (
        <>
            <Table hover className="text-center">
                <thead>
                    <tr className="text-center">
                        <th>Name</th>
                        <th>Email</th>
                        <th>Roles</th>
                        <th>Date Created</th>
                        <th>Date Updated</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {volunteers.map((volunteer) => (
                        <tr key={volunteer.username} className="text-center align-middle">
                            <td>{volunteer.name}</td>
                            <td>{volunteer.email}</td>
                            <td>{volunteer.roles}</td>
                            <td>{volunteer.date_created}</td>
                            <td>{volunteer.date_updated}</td>
                            <td>
                                <button className="outline-warning me-2" onClick={() => onViewDetails("editVolunteers", volunteer)}>
                                    View Volunteer Details
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </>
    );
}

function ReviewLogDataContent({ onViewDetails }) {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/admin/logs");
            const data = await response.json();
            setLogs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching logs:", error);
            alert("Error fetching logs.");
            setLogs([]);
        }
    };

    return (
        <>
            <Table hover className="text-center">
                <thead>
                    <tr className="text-center">
                        <th>Name</th>
                        <th>Email</th>
                        <th>Date</th>
                        <th>Message</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <tr key={log.id} className="text-center align-middle">
                            <td>{log.name}</td>
                            <td>{log.email}</td>
                            <td>{log.date}</td>
                            <td>{log.message}</td>
                            <td>
                                <button className="outline-warning me-2" onClick={() => onViewDetails("editLogs", log)}>
                                    View Log Details
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
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
    }
};

function AdminModal({ show, onHide, type}) {
    const [detailModalType, setDetailModalType] = useState("");
    const [selectedData, setSelectedData] = useState(null);
    const config = MODAL_TYPE[type];

    const handleViewDetails = (detailType, data) => {
        setSelectedData(data);
        setDetailModalType(detailType);
    }

    return (
        <Modal show={show} className="modal-wide" onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>{config?.title || ""}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {config && <config.Content onViewDetails={handleViewDetails} />}
            </Modal.Body>
            <AdminDetailsModal show={!!detailModalType} type={detailModalType} data={selectedData}
             onHide={() => { setDetailModalType(""); setSelectedData(null); }} />
        </Modal>
    );
}

export default AdminModal;