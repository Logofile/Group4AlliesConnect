import React from 'react';
import { Row, Col, Button, Image } from 'react-bootstrap';

function MapPinDetails({ details }) {
    if (!details) return null;

    return (
        <div style={{ padding: '5px', fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', maxWidth: '650px', width: '100%' }}>
            <h4 style={{ marginBottom: '15px', color: '#333', fontWeight: '500' }}>{details.name}</h4>

            <Row>
                <Col xs={12} md={4} style={{ paddingRight: '10px', marginBottom: '15px' }}>
                    <div style={{ height: '100%', minHeight: '180px', borderRadius: '4px', overflow: 'hidden' }}>
                        {/* TODO: Uses a static placeholder image for the time being */}
                        <Image
                            src={details.image || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=500&q=80"}
                            alt={details.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                </Col>
                {/* Wraps the text always for small screens, and puts the text to the right on larger screens */}
                <Col xs={12} md={8} style={{ paddingLeft: '10px' }}>
                    <div style={{ fontSize: '13px', lineHeight: '1.4', color: '#444' }}>
                        {details.address && <div>Address: {details.address}</div>}
                        {details.hours && (
                            <div>
                                Hours:<br />
                                <span style={{ whiteSpace: 'pre-line' }}>{details.hours}</span>
                            </div>
                        )}
                        {details.phone && <div>Phone: {details.phone}</div>}
                        {details.website && (
                            <div>
                                Website: <a href={details.website} target="_blank" rel="noopener noreferrer" style={{ color: '#0097a7' }}>{details.website_display || details.website}</a>
                            </div>
                        )}
                        {details.socialMedia && details.socialMedia.length > 0 && (
                            <div>
                                Social Media: {
                                    details.socialMedia.map((sm, i) => (
                                        <React.Fragment key={sm.name}>
                                            <a href={sm.link} target="_blank" rel="noopener noreferrer" style={{ color: '#0097a7', textDecoration: 'underline' }}>{sm.name}</a>
                                            {i < details.socialMedia.length - 1 ? ', ' : ''}
                                        </React.Fragment>
                                    ))
                                }
                            </div>
                        )}
                        {details.languages && details.languages.length > 0 && (
                            <div>Languages: {details.languages.join(', ')}</div>
                        )}
                    </div>

                    <div className="mt-3">
                        <div className="d-flex mb-2" style={{ gap: '10px' }}>
                            {/* TODO: Make the buttons go to a page */}
                            <Button
                                variant="outline-info"
                                style={{ flex: 1, borderRadius: '20px', fontSize: '12px', padding: '6px 15px', borderColor: '#0097a7', color: '#0097a7', backgroundColor: 'transparent' }}>
                                Eligibility Requirements
                            </Button>
                            <Button
                                variant="info"
                                style={{ flex: 1, borderRadius: '20px', fontSize: '12px', padding: '6px 15px', backgroundColor: '#0097a7', borderColor: '#0097a7', color: 'white' }}>
                                Upcoming Events
                            </Button>
                        </div>
                        <Button
                            variant="outline-info"
                            style={{ width: '100%', borderRadius: '20px', fontSize: '12px', padding: '6px 15px', borderColor: '#0097a7', color: '#0097a7', backgroundColor: 'transparent' }}>
                            Volunteer With This Resource
                        </Button>
                    </div>
                </Col>
            </Row>

            {details.description && (
                <div className="mt-4">
                    <h5 style={{ fontSize: '18px', marginBottom: '8px', color: '#333', fontWeight: '400' }}>About Us</h5>
                    <p style={{ fontSize: '14px', color: '#333', lineHeight: '1.5' }}>
                        {details.description}
                    </p>
                </div>
            )}
        </div>
    );
}

export default MapPinDetails;
