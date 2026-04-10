import "../App.css";
import { Modal, Table} from "react-bootstrap";
import { useEffect, useState} from "react";
import axios from "axios";
import AdminDetailsModal from "./AdminDetailsModal";

function useTableDataProcessing(data, searchField) {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [searchQuery, setSearchQuery] = useState("");

    const handleSort = (key) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === "asc" ? "desc" : "asc"
        }));
    };

    const sortSymbol = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === "asc" ? " ▲" : " ▼";
        }
        return " ";
    }

    const sortedData = [...data].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === "asc" ? -1 : 1;
        }
        return 0;
    })
    .filter(item => String(item[searchField] ?? "").toLowerCase().includes(searchQuery.toLowerCase()));

    return { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery };
}

function PendingOrgsContent({ onViewDetails }) {
    const [pendingOrgs, setPendingOrgs] = useState([]);
    const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } = useTableDataProcessing(pendingOrgs, ["name", "email", "application_date", "ein"]);

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
            <input type="text" className="form-control mb-3" placeholder="Search by name, email, date, or EIN" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <Table hover className="text-center">
                <thead>
                    <tr className="text-center">
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("name")}>
                            Organization {sortSymbol("name")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("email")}>
                            Email {sortSymbol("email")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("application_date")}>
                            Date {sortSymbol("application_date")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("ein")}>
                            EIN {sortSymbol("ein")}
                        </th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((org) => (
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
    const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } = useTableDataProcessing(accounts, ["name", "email", "roles", "date_created", "date_updated"]);

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
            <input type="text" className="form-control mb-3" placeholder="Search by name, email, or roles" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <Table hover className="text-center">
                <thead>
                    <tr className="text-center">
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("name")}>
                            Name {sortSymbol("name")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("email")}>
                            Email {sortSymbol("email")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("roles")}>
                            Roles {sortSymbol("roles")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("date_created")}>
                            Date Created {sortSymbol("date_created")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("date_updated")}>
                            Date Updated {sortSymbol("date_updated")}
                        </th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((account) => (
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
    const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } = useTableDataProcessing(resources, ["name", "location", "organization", "date_created", "date_updated"]);

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/resources");
            const data = await response.json();
            setResources(Array.isArray(data) ? data : []);
            console.log("Fetched resources:", data);
        } catch (error) {
            console.error("Error fetching resources:", error);
            alert("Error fetching resources.");
            setResources([]);
        }
    };

    return (
        <>
            <input type="text" className="form-control mb-3" placeholder="Search by name, location, or organization" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <Table hover className="text-center">
                <thead>
                    <tr className="text-center">
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("name")}>
                            Name {sortSymbol("name")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("location")}>
                            Location {sortSymbol("location")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("organization")}>
                            Organization {sortSymbol("organization")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("event_date")}>
                            Event Date {sortSymbol("event_date")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("category_id")}>
                            Category {sortSymbol("category_id")}
                        </th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((resource) => (
                        <tr key={resource.resource_id} className="text-center align-middle">
                            <td>{resource.name}</td>
                            <td>{resource.location}</td>
                            <td>{resource.organization}</td>
                            <td>{resource.event_date}</td>
                            <td>{resource.category_id}</td>
                            <td>
                                <button className="outline-warning me-2" onClick={() => onViewDetails("manageResources", resource)}>
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
    const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } = useTableDataProcessing(events, ["name", "location", "organization", "date_created", "date_updated"]);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/events");
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
            <input type="text" className="form-control mb-3" placeholder="Search by name, location, or organization" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <Table hover className="text-center">
                <thead>
                    <tr className="text-center">
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("title")}>
                            Title {sortSymbol("title")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("location")}>
                            Location {sortSymbol("location")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("organization")}>
                            Organization {sortSymbol("organization")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("event_date")}>
                            Event Date {sortSymbol("event_date")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("category_id")}>
                            Category {sortSymbol("category_id")}
                        </th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((event) => (
                        <tr key={event.event_id} className="text-center align-middle">
                            <td>{event.title}</td>
                            <td>{event.location}</td>
                            <td>{event.organization}</td>
                            <td>{event.event_date}</td>
                            <td>{event.category_id}</td>
                            <td>
                                <button className="outline-warning me-2" onClick={() => onViewDetails("manageEvents", event)}>
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
    const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } = useTableDataProcessing(volunteers, ["name", "email", "roles", "date_created", "date_updated"]);

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
            <input type="text" className="form-control mb-3" placeholder="Search by name, email, or roles" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <Table hover className="text-center">
                <thead>
                    <tr className="text-center">
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("name")}>
                            Name {sortSymbol("name")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("email")}>
                            Email {sortSymbol("email")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("roles")}>
                            Roles {sortSymbol("roles")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("date_created")}>
                            Date Created {sortSymbol("date_created")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("date_updated")}>
                            Date Updated {sortSymbol("date_updated")}
                        </th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((volunteer) => (
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
    const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } = useTableDataProcessing(logs, ["name", "email", "data", "message"]);

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
            <input type="text" className="form-control mb-3" placeholder="Search by name, email, date, or message" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <Table hover className="text-center">
                <thead>
                    <tr className="text-center">
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("name")}>
                            Name {sortSymbol("name")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("email")}>
                            Email {sortSymbol("email")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("date")}>
                            Date {sortSymbol("date")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("message")}>
                            Message {sortSymbol("message")}
                        </th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((log) => (
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