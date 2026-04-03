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
        title: "Pending Organization Details",
        Content: PendingOrgsContent
    },
    editAccounts: {
        title: "Edit Account Details",
        Content: EditAccountsContent
    },
    manageResources: {
        title: "Manage Resource Details",
        Content: ManageResourcesContent
    },
    manageEvents: {
        title: "Manage Event Details",
        Content: ManageEventsContent
    },
    manageVolunteers: {
        title: "Manage Volunteer Details",
        Content: ManageVolunteersContent
    },
    reviewLogData: {
        title: "Review Log Data",
        Content: ReviewLogDataContent
    },
};

function AdminDetailsModal({ show, onHide, type}) {
    const config = MODAL_TYPE[type];

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>{config?.title || ""}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {config && <config.Content />}
            </Modal.Body>
        </Modal>
    );
}

export default AdminDetailsModal;