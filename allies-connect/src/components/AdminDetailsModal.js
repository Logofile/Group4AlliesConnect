import "../App.css";
import { Modal, Table } from "react-bootstrap";
import { useEffect, useState} from "react";
import axios from "axios";

function PendingOrgsContent() {
    return (
        <>
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
};

function AdminDetailsModal({ show, onHide, org }) {
    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Admin Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {config && <config.Content />}
            </Modal.Body>
        </Modal>
    );
}

export default AdminDetailsModal;