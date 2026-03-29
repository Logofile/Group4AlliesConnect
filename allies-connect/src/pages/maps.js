import React, { useState, useEffect } from "react";
import { Container, Form, Button } from "react-bootstrap";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import axios from "axios";
import MapPinDetails from "../components/MapPinDetails";
import '../App.css';

const API_KEY = process.env.REACT_APP_MAP_API_KEY || "";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Set the initial center of the map to the middle of Atlanta
const DEFAULT_CENTER = { lat: 33.7490, lng: -84.3880 };

// Hook into the mapping library's context
function MapUpdater({ userLocation }) {
    const map = useMap();

    // Whenever 'map' or 'userLocation' changes, run this code
    useEffect(() => {
        if (map && userLocation) {
            map.panTo(userLocation); // Smoothly moves the camera
            map.setZoom(13); // Zooms in closer since we know their location now
        }
    }, [map, userLocation]);

    return null; // It doesn't render any visible UI
}

function Maps() {

    // The dynamic pins loaded from the database backend
    const [mapPins, setMapPins] = useState([]);

    // The location of the user
    const [userLocation, setUserLocation] = useState(null);

    // Fetch the pins when the page loads
    useEffect(() => {
        Promise.all([
            axios.get(`${API_URL}/api/events`),
            axios.get(`${API_URL}/api/resources`)
        ])
            .then(([eventsResponse, resourcesResponse]) => {
                const formatEvent = (event) => {
                    const pinColor = 'yellow'; // All events use the yellow pin

                    const startTime = new Date(event.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const endTime = new Date(event.end_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return {
                        id: `event-${event.event_id}`,
                        name: `${event.title} (Event)`,
                        color: pinColor,
                        position: {
                            lat: parseFloat(event.latitude),
                            lng: parseFloat(event.longitude)
                        },
                        address: `${event.street_address_1}, ${event.city}, ${event.state} ${event.zip}`,
                        hours: `${startTime} - ${endTime}`,
                        description: event.description || "No description provided.",
                        image: event.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=500&q=80"
                    };
                };

                const formatResource = (resource) => {
                    let pinColor = '';
                    if (resource.category_name === 'Food Assistance') pinColor = 'green';
                    else if (resource.category_name === 'Housing') pinColor = 'blue';
                    else if (resource.category_name === 'Legal') pinColor = 'pink';

                    return {
                        id: `resource-${resource.resource_id}`,
                        name: `${resource.name} (Resource)`,
                        color: pinColor,
                        position: {
                            lat: parseFloat(resource.latitude) - 0.0003, // Tiny offset to prevent overlapping
                            lng: parseFloat(resource.longitude) + 0.0003
                        },
                        address: `${resource.street_address_1}, ${resource.city}, ${resource.state} ${resource.zip}`,
                        hours: resource.hours || "Hours not specified",
                        description: resource.description || "No description provided.",
                        image: resource.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=500&q=80"
                    };
                };

                const eventsPins = eventsResponse.data.map(formatEvent);
                const resourcesPins = resourcesResponse.data.map(formatResource);
                const allPins = [...eventsPins, ...resourcesPins];

                // Filter out events that don't have valid map coordinates
                const validPins = allPins.filter(pin => !isNaN(pin.position.lat) && !isNaN(pin.position.lng));
                setMapPins(validPins);
            })
            .catch(error => {
                console.error("Error fetching map pins from database:", error);
            });
    }, []);

    // Fetch the user's location when the page loads
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // The user clicked "Allow Location"
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    // They clicked "Deny" or their device doesn't support it
                    // TODO: Add a modal to ask the user for their location
                    console.log("Location not provided. Waiting for manual input.");
                }
            );
        }
    }, []);

    // The filters for the types of pins to display
    const [filters, setFilters] = useState({
        yellow: true,
        green: true,
        blue: true,
        pink: true
    });

    // The pin that is currently selected
    const [selectedPin, setSelectedPin] = useState(null);

    // Whether the filters panel is expanded
    const [filtersExpanded, setFiltersExpanded] = useState(true);

    const handleFilterChange = (color) => {
        setFilters((prev) => ({
            ...prev,
            [color]: !prev[color]
        }));
    };

    const filteredPins = mapPins.filter((pin) => filters[pin.color]);

    return (
        <Container fluid style={{ height: "calc(100vh - 80px)", padding: 0, position: "relative" }}>

            {/* Filter Overlay UI */}
            <div style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                zIndex: 1000,
                minWidth: "200px",
                transition: "all 0.3s ease"
            }}>
                {/* The filter panel */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0" style={{ color: "var(--gold)" }}>Filters</h5>
                    <Button
                        variant="link"
                        size="sm"
                        onClick={() => setFiltersExpanded(!filtersExpanded)}
                        style={{ padding: 0, color: '#333', textDecoration: 'none' }}
                    >
                        {filtersExpanded ? '▼' : '▶'}
                    </Button>
                </div>

                {/* The filter options */}
                {filtersExpanded && (
                    <Form>
                        <div className="d-flex align-items-center mb-2">
                            <span style={{ display: "inline-block", width: "14px", height: "14px", backgroundColor: "#fff579", borderRadius: "50%", marginRight: "10px" }}></span>
                            <Form.Check
                                type="checkbox"
                                label="Events"
                                checked={filters.yellow}
                                onChange={() => handleFilterChange("yellow")}
                                id="filter-yellow"
                                className="mb-0"
                            />
                        </div>
                        <div className="d-flex align-items-center mb-2">
                            <span style={{ display: "inline-block", width: "14px", height: "14px", backgroundColor: "#00e85f", borderRadius: "50%", marginRight: "10px" }}></span>
                            <Form.Check
                                type="checkbox"
                                label="Food Assistance"
                                checked={filters.green}
                                onChange={() => handleFilterChange("green")}
                                id="filter-green"
                                className="mb-0"
                            />
                        </div>
                        <div className="d-flex align-items-center mb-2">
                            <span style={{ display: "inline-block", width: "14px", height: "14px", backgroundColor: "#5d94f8", borderRadius: "50%", marginRight: "10px" }}></span>
                            <Form.Check
                                type="checkbox"
                                label="Housing"
                                checked={filters.blue}
                                onChange={() => handleFilterChange("blue")}
                                id="filter-blue"
                                className="mb-0"
                            />
                        </div>
                        <div className="d-flex align-items-center">
                            <span style={{ display: "inline-block", width: "14px", height: "14px", backgroundColor: "#e95daa", borderRadius: "50%", marginRight: "10px" }}></span>
                            <Form.Check
                                type="checkbox"
                                label="Legal"
                                checked={filters.pink}
                                onChange={() => handleFilterChange("pink")}
                                id="filter-pink"
                                className="mb-0"
                            />
                        </div>
                        {/* TODO: Update the distance filter to use the user's location */}
                        <div className="d-flex align-items-center mt-3">
                            <Form.Label className="mb-0 me-2" style={{ fontWeight: 500 }}>Distance</Form.Label>
                            <Form.Control
                                type="number"
                                min="0"
                                max="999"
                                style={{ width: "70px", padding: "0.25rem 0.5rem" }}
                                className="me-2 text-center"
                            />
                            <span style={{ fontWeight: 500 }}>miles</span>
                        </div>
                    </Form>
                )}
            </div>

            <APIProvider apiKey={API_KEY}>
                <MapUpdater userLocation={userLocation} />
                <Map
                    defaultCenter={DEFAULT_CENTER}
                    defaultZoom={10}
                    gestureHandling={"greedy"}
                    mapId={process.env.REACT_APP_MAP_ID || "DEMO_MAP_ID"}
                >
                    {/* The pins to display */}
                    {filteredPins.map((pin) => {
                        let hexColor = '';
                        if (pin.color === 'yellow') hexColor = '#fff579';
                        else if (pin.color === 'green') hexColor = '#00e85f';
                        else if (pin.color === 'blue') hexColor = '#5d94f8';
                        else if (pin.color === 'pink') hexColor = '#e95daa';

                        return (
                            <AdvancedMarker
                                key={pin.id}
                                position={pin.position}
                                title={pin.name}
                                onClick={() => setSelectedPin(pin)}
                            >
                                <Pin background={hexColor} borderColor={'#333'} glyphColor={'#333'} />
                            </AdvancedMarker>
                        );
                    })}

                    {/* The info window to display when a pin is selected */}
                    {selectedPin && (
                        <InfoWindow
                            position={selectedPin.position}
                            onCloseClick={() => setSelectedPin(null)}
                            style={{ padding: 0 }}
                        >
                            <MapPinDetails details={selectedPin} />
                        </InfoWindow>
                    )}
                </Map>
            </APIProvider>
        </Container>
    );
}

export default Maps;