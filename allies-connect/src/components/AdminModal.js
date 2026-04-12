import "../App.css";
import { Modal, Table} from "react-bootstrap";
import { useEffect, useState} from "react";
import axios from "axios";
import AdminDetailsModal from "./AdminDetailsModal";

const getAuthHeaders = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    return { "x-user-id": user?.user_id };
};

function useTableDataProcessing(data, searchFields) {
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
        return "  ";
    }

    const sortedData = [...data]
        .filter(item =>
            searchFields.some(field =>
                String(item[field] ?? "").toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
        .sort((a, b) => {
            if (!sortConfig.key) return 0;
            return sortConfig.direction === "asc"
                ? String(a[sortConfig.key] ?? "").localeCompare(String(b[sortConfig.key] ?? ""))
                : String(b[sortConfig.key] ?? "").localeCompare(String(a[sortConfig.key] ?? ""));
        });

    return { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery };}

function PendingOrgsContent({ onViewDetails }) {
    const [pendingOrgs, setPendingOrgs] = useState([]);
    const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } = useTableDataProcessing(pendingOrgs, ["name", "email", "application_date", "ein"]);

    useEffect(() => {
        fetchPendingOrgs();
    }, []);

    const fetchPendingOrgs = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/admin/pending-providers",
                { headers: getAuthHeaders() });
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
            await axios.patch(`http://localhost:5000/api/admin/providers/${orgId}/approve`,
                {}, { headers: getAuthHeaders() });            
            alert("Organization approved successfully.");
            fetchPendingOrgs();
        } catch (error) {
            console.error("Error approving organization:", error);
            alert("Error approving organization.");
        }
    };

    const handleReject = async (orgId) => {
        try {
            await axios.patch(`http://localhost:5000/api/admin/providers/${orgId}/status`,
                { status: "suspended" }, { headers: getAuthHeaders() });
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
                            Application Date {sortSymbol("application_date")}
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
                            <td>{org.name || "N/A"}</td>
                            <td>{org.email || "N/A"}</td>
                            <td>{org.application_date || "N/A"}</td>
                            <td>{org.ein || "N/A"}</td>
                            <td>
                                <button className="outline-warning me-2" onClick={() => onViewDetails("pendingOrgs", org)}>
                                    View Full Application
                                </button>
                                <button className="btn-green me-2" onClick={() => handleApprove(org.provider_id)}>
                                    Approve
                                </button>
                                <button className="btn-red" onClick={() => handleReject(org.provider_id)}>
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
            const response = await fetch("http://localhost:5000/api/admin/accounts",
                { headers: getAuthHeaders() });
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
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((account) => (
                        <tr key={account.username} className="text-center align-middle">
                            <td>{account.name || "N/A"}</td>
                            <td>{account.email || "N/A"}</td>
                            <td>{account.roles || "N/A"}</td>
                            <td>{account.date_created || "N/A"}</td>
                            <td>{account.date_updated || "N/A"}</td>
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
    const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } = useTableDataProcessing(resources, ["name", "provider_name", "category_name", "city", "state"]);

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/resources");
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
            <input type="text" className="form-control mb-3" placeholder="Search by name, location, or organization" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <Table hover className="text-center">
                <thead>
                    <tr className="text-center">
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("name")}>
                            Name {sortSymbol("name")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("zip")}>
                            Zip Code {sortSymbol("zip")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("provider_name")}>
                            Organization {sortSymbol("provider_name")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("hours")}>
                            Hours {sortSymbol("hours")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("category_name")}>
                            Category {sortSymbol("category_name")}
                        </th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.length === 0 ? (
                        <tr><td colSpan={6}>No results found.</td></tr>
                    ) : (
                        sortedData.map((resource) => (
                            <tr key={resource.resource_id} className="align-middle">
                                <td>{resource.name}</td>
                                <td>{resource.zip}</td>
                                <td>{resource.provider_name}</td>
                                <td>{resource.hours}</td>
                                <td>{resource.category_name}</td>
                                <td>
                                    <button className="outline-warning me-2" onClick={() => onViewDetails("manageResources", resource)}>
                                        View Resource Details
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>
        </>
    );
}

function ManageEventsContent({ onViewDetails }) {
    const [events, setEvents] = useState([]);
    const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } = useTableDataProcessing(events, ["title", "provider_name", "category_name", "city"]);

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

    const formatDisplayDateTime = (value) => {
        if (!value) return "";
        const date = new Date(value);
        return date.toLocaleString("en-US", {
            timeZone: "UTC",
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
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
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("zip")}>
                            Zip Code {sortSymbol("zip")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("provider_name")}>
                            Organization {sortSymbol("provider_name")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("start_datetime")}>
                            Start Time {sortSymbol("start_datetime")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("category_name")}>
                            Category {sortSymbol("category_name")}
                        </th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.length === 0 ? (
                        <tr><td colSpan={6}>No results found.</td></tr>
                    ) : (
                        sortedData.map((event) => (
                            <tr key={event.event_id} className="align-middle">
                                <td>{event.title}</td>
                                <td>{event.provider_name}</td>
                                <td>{event.category_name}</td>
                                <td>{formatDisplayDateTime(event.start_datetime)}</td>
                                <td>{event.category_name}</td>
                                <td>
                                    <button className="outline-warning me-2" onClick={() => onViewDetails("manageEvents", event)}>
                                        View Event Details
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>
        </>
    );
}

function ManageVolunteersContent({ onViewDetails }) {
    const [volunteers, setVolunteers] = useState([]);
    const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } = useTableDataProcessing(volunteers, ["title", "provider_name", "status", "contact_name", "contact_email"]);

    useEffect(() => { fetchVolunteers(); }, []);

    const fetchVolunteers = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/volunteer-opportunities");
            const data = await response.json();
            setVolunteers(Array.isArray(data) ? data : []);
        } catch (error) {
            setVolunteers([]);
        }
    };

    return (
        <>
            <input type="text" className="form-control mb-3" placeholder="Search by title, provider, or status"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <Table hover className="text-center">
                <thead>
                    <tr>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("title")}>
                            Title {sortSymbol("title")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("provider_name")}>
                            Provider {sortSymbol("provider_name")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("status")}>
                            Status {sortSymbol("status")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("contact_name")}>
                            Contact {sortSymbol("contact_name")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("contact_email")}>
                            Email {sortSymbol("contact_email")}
                        </th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.length === 0 ? (
                        <tr><td colSpan={6}>No results found.</td></tr>
                    ) : (
                        sortedData.map((volunteer) => (
                            <tr key={volunteer.opportunity_id} className="align-middle">
                                <td>{volunteer.title}</td>
                                <td>{volunteer.provider_name}</td>
                                <td>{volunteer.status}</td>
                                <td>{volunteer.contact_name}</td>
                                <td>{volunteer.contact_email}</td>
                                <td>
                                    <button className="outline-warning me-2" onClick={() => onViewDetails("manageVolunteers", volunteer)}>
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>
        </>
    );
}

function ReviewLogDataContent({ onViewDetails }) {
    const [logs, setLogs] = useState([]);
    const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } = useTableDataProcessing(logs, ["action", "entity_type", "actor_user_id", "occured_at"]);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/admin/logs",
                { headers: getAuthHeaders() });
            const data = await response.json();
            setLogs(Array.isArray(data) ? data : []);
            console.log("Fetched resources:", data);
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
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("log_id")}>
                            Log ID {sortSymbol("log_id")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("action")}>
                            Action {sortSymbol("action")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("actor_user_id")}>
                            Actor User ID {sortSymbol("actor_user_id")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("entity_type")}>
                            Entity Type {sortSymbol("entity_type")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("occured_at")}>
                            Date {sortSymbol("occured_at")}
                        </th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((log) => (
                        <tr key={log.log_id} className="text-center align-middle">
                            <td>{log.log_id || "N/A"}</td>
                            <td>{log.action || "N/A"}</td>
                            <td>{log.actor_user_id || "N/A"}</td>
                            <td>{log.entity_type || "N/A"}</td>
                            <td>{log.occured_at || "N/A"}</td>
                            <td>
                                <button className="outline-warning me-2" onClick={() => onViewDetails("reviewLogData", log)}>
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
    const [refreshCallback, setRefreshCallback] = useState({ fn: null });
    const config = MODAL_TYPE[type];

    const handleViewDetails = (detailType, data, onRefresh) => {
        setSelectedData(data);
        setDetailModalType(detailType);
        setRefreshCallback({ fn: onRefresh });
    };

    return (
        <Modal show={show} className="modal-wide" onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>{config?.title || ""}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {config && <config.Content onViewDetails={handleViewDetails} />}
            </Modal.Body>
            <AdminDetailsModal show={!!detailModalType} type={detailModalType} data={selectedData} onRefresh={refreshCallback.fn} onHide={() => { setDetailModalType(""); setSelectedData(null); }}/>
        </Modal>
    );
}

export default AdminModal;