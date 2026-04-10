import "../App.css";
import { Modal, Col, Row} from "react-bootstrap";
import { useEffect, useState} from "react";
import axios from "axios";

function PendingOrgsContent({ data }) {
    return (
        <>
        </>
    );
}

function EditAccountsContent({ data }) {
    return (
        <>
        </>
    );
}

function ManageResourcesContent({ data }) {
    return (
        <>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Resource Name:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.name}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Resource ID:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.resource_id}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Description:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.description}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Hours:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.hours}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Category:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.category_name}</p>
                </Col>
            </Row>
             <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Category ID:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.category_id}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Eligibility Requirements:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.eligibility_requirements}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Provider Name:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.provider_name}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Provider ID:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.provider_id}</p>
                </Col>
            </Row>
             <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Location ID:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.location_id}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Street Address:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.street_address_1} {data?.street_address_2}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>City:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.city}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>State:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.state}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Zip Code:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.zip}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Latitude:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.latitude}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Longitude:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.longitude}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Image URL:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.image_url}</p>
                </Col>
            </Row>
        </>
    );
}

function ManageEventsContent({ data }) {
    return (
        <>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Event Name:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.title}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Event ID:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.event_id}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Description:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.description}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Start Date and Time:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.start_datetime}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>End Date and Time:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.end_datetime}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Category:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.category_name}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Category ID:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.category_id}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Registration Required:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.registration_required}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Special Instructions:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.special_instructions}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Provider Name:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.provider_name}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Provider ID:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.provider_id}</p>
                </Col>
            </Row>
             <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Location:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.location_id}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Street Address:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.street_address_1} {data?.street_address_2}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>City:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.city}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>State:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.state}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Zip Code:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.zip}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Latitude:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.latitude}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Longitude:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.longitude}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Image URL:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.image_url}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Flyer URL:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.flyer_url}</p>
                </Col>
            </Row>
            <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                    <h5>Created At:</h5>
                </Col>
                <Col md={9} className="d-flex align-items-center">
                    <p>{data?.created_at}</p>
                </Col>
            </Row>
        </>
    );
}

function ManageVolunteersContent({ data }) {
    return (
        <>
        </>
    );
}

function ReviewLogDataContent({ data }) {
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
        title: "Log Data Details",
        Content: ReviewLogDataContent
    },
};

function AdminDetailsModal({ show, onHide, type, data}) {
    const config = MODAL_TYPE[type];

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>{config?.title || ""}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {config && <config.Content data={data}/>}
            </Modal.Body>
        </Modal>
    );
}

export default AdminDetailsModal;