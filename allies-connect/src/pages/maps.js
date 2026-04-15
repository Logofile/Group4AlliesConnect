import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Button, Container, Form, Modal } from "react-bootstrap";
import "../App.css";
import MapPinDetails from "../components/MapPinDetails";

const API_KEY = process.env.REACT_APP_MAP_API_KEY || "";
const API_URL = process.env.REACT_APP_API_URL;

// Set the initial center of the map to the middle of Atlanta
const DEFAULT_CENTER = { lat: 33.749, lng: -84.388 };

// Calculate distance in miles using Haversine formula
// Note: This function is 100% AI-generated
function calculateDistanceInMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of the earth in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
  const [userLocation, setUserLocation] = useState(() => {
    const savedLocation = localStorage.getItem("userSavedLocation");
    return savedLocation ? JSON.parse(savedLocation) : null;
  });

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressInput, setAddressInput] = useState(
    () => localStorage.getItem("userSavedAddress") || "",
  );
  const [addressError, setAddressError] = useState("");
  const isMobileDevice = /Mobi|Android|iPhone/i.test(navigator.userAgent);
  const [gpsActive, setGpsActive] = useState(() => {
    return isMobileDevice && !localStorage.getItem("userSavedAddress");
  });

  const distanceInputRef = useRef(null);

  // Initialize distance filter from localStorage
  const [distanceInputVal, setDistanceInputVal] = useState(() => {
    return localStorage.getItem("userSavedDistance") || "";
  });
  const [debouncedDistance, setDebouncedDistance] = useState(distanceInputVal);
  const [distanceErrorMsg, setDistanceErrorMsg] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDistance(distanceInputVal);
      localStorage.setItem("userSavedDistance", distanceInputVal);
    }, 500);
    return () => clearTimeout(timer);
  }, [distanceInputVal]);

  const handleDistanceChange = (e) => {
    if (e.target.validity.badInput) {
      setDistanceInputVal("");
      setDistanceErrorMsg("Enter a number between 1 and 50");
      return;
    }
    const val = e.target.value;
    if (val === "") {
      setDistanceInputVal("");
      setDistanceErrorMsg("");
    } else {
      setDistanceInputVal(val);
      if (parseFloat(val) <= 0) {
        setDistanceErrorMsg("Enter a number between 1 and 50");
      } else {
        setDistanceErrorMsg("");
      }
    }
  };

  const handleAddressSubmit = async (e) => {
    if (e) e.preventDefault();
    setAddressError("");
    if (!addressInput.trim()) {
      setAddressError("Address cannot be empty.");
      return;
    }
    try {
      const response = await axios.get(
        "https://maps.googleapis.com/maps/api/geocode/json",
        {
          params: {
            address: addressInput,
            key: API_KEY,
          },
        },
      );
      if (response.data.status === "OK" && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        const newLocation = { lat: location.lat, lng: location.lng };
        setUserLocation(newLocation);
        localStorage.setItem("userSavedLocation", JSON.stringify(newLocation));
        localStorage.setItem("userSavedAddress", addressInput);
        setGpsActive(false);
        setShowAddressModal(false);
      } else {
        setAddressError("Address not found. Please try a different address.");
      }
    } catch (err) {
      console.error("Address not found:", err);
      setAddressError(
        "An error occurred while communicating with the Maps API.",
      );
    }
  };

  // Fetch the pins when the page loads
  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/api/events`),
      axios.get(`${API_URL}/api/resources`),
    ])
      .then(([eventsResponse, resourcesResponse]) => {
        const formatEvent = (event) => {
          const pinColor = "yellow"; // All events use the yellow pin

          const startTime = new Date(event.start_datetime).toLocaleTimeString(
            [],
            { hour: "2-digit", minute: "2-digit" },
          );
          const endTime = new Date(event.end_datetime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          return {
            id: `event-${event.event_id}`,
            name: `${event.title} (Event)`,
            color: pinColor,
            position: {
              lat: parseFloat(event.latitude),
              lng: parseFloat(event.longitude),
            },
            address: `${event.street_address_1}, ${event.city}, ${event.state} ${event.zip}`,
            hours: `${startTime} - ${endTime}`,
            description: event.description || "No description provided.",
            image:
              event.image ||
              "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=500&q=80",
          };
        };

        const formatResource = (resource) => {
          let pinColor = "";
          if (resource.category_name === "Food Assistance") pinColor = "green";
          else if (resource.category_name === "Housing") pinColor = "blue";
          else if (resource.category_name === "Legal") pinColor = "pink";

          return {
            id: `resource-${resource.resource_id}`,
            resource_id: resource.resource_id,
            name: `${resource.name} (Resource)`,
            color: pinColor,
            position: {
              lat: parseFloat(resource.latitude) - 0.0003, // Tiny offset to prevent overlapping
              lng: parseFloat(resource.longitude) + 0.0003,
            },
            address: `${resource.street_address_1}, ${resource.city}, ${resource.state} ${resource.zip}`,
            hours: resource.hours || "Hours not specified",
            description: resource.description || "No description provided.",
            eligibility_requirements: resource.eligibility_requirements || null,
            image:
              resource.image ||
              "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=500&q=80",
          };
        };

        const eventsPins = eventsResponse.data.map(formatEvent);
        const resourcesPins = resourcesResponse.data.map(formatResource);
        const allPins = [...eventsPins, ...resourcesPins];

        // Filter out events that don't have valid map coordinates
        const validPins = allPins.filter(
          (pin) => !isNaN(pin.position.lat) && !isNaN(pin.position.lng),
        );
        setMapPins(validPins);
      })
      .catch((error) => {
        console.error("Error fetching map pins from database:", error);
      });
  }, []);

  // Fetch the user's location when the page loads
  useEffect(() => {
    if (userLocation) return; // Skip if location was loaded from localStorage

    if (isMobileDevice) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // The user clicked "Allow Location"
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setGpsActive(true);
          },
          (error) => {
            // They clicked "Deny" or their device doesn't support it
            console.warn("Location not provided. GPS error:", error);
            setGpsActive(false);
            setShowAddressModal(true);
          },
        );
      } else {
        console.warn(
          "Geolocation not supported (might be an insecure HTTP connection).",
        );
        setGpsActive(false);
        setShowAddressModal(true);
      }
    } else {
      // Desktop user: prompt them for an address immediately
      setGpsActive(false);
      setShowAddressModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The filters for the types of pins to display
  const [filters, setFilters] = useState({
    yellow: true,
    green: true,
    blue: true,
    pink: true,
  });

  // The pin that is currently selected
  const [selectedPin, setSelectedPin] = useState(null);

  // Whether the filters panel is expanded
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  const handleFilterChange = (color) => {
    setFilters((prev) => ({
      ...prev,
      [color]: !prev[color],
    }));
  };

  const filteredPins = mapPins.filter((pin) => {
    // 1. Filter by color category
    if (!filters[pin.color]) return false;

    // 2. Filter by distance
    const distLimit = parseFloat(debouncedDistance);
    if (!isNaN(distLimit) && distLimit > 0 && userLocation) {
      const dist = calculateDistanceInMiles(
        userLocation.lat,
        userLocation.lng,
        pin.position.lat,
        pin.position.lng,
      );
      if (dist > distLimit) return false;
    }
    return true;
  });

  return (
    <Container
      fluid
      style={{ height: "calc(100vh - 80px)", padding: 0, position: "relative" }}
    >
      {/* Filter Overlay UI */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 1000,
          minWidth: "200px",
          transition: "all 0.3s ease",
        }}
      >
        {/* The filter panel */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0" style={{ color: "var(--gold)" }}>
            Filters
          </h5>
          <Button
            variant="link"
            size="sm"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            style={{ padding: 0, color: "#333", textDecoration: "none" }}
          >
            {filtersExpanded ? "▼" : "▶"}
          </Button>
        </div>

        {/* The filter options */}
        {filtersExpanded && (
          <Form>
            <div className="d-flex align-items-center mb-2">
              <span
                style={{
                  display: "inline-block",
                  width: "14px",
                  height: "14px",
                  backgroundColor: "#fff579",
                  borderRadius: "50%",
                  marginRight: "10px",
                }}
              ></span>
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
              <span
                style={{
                  display: "inline-block",
                  width: "14px",
                  height: "14px",
                  backgroundColor: "#00e85f",
                  borderRadius: "50%",
                  marginRight: "10px",
                }}
              ></span>
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
              <span
                style={{
                  display: "inline-block",
                  width: "14px",
                  height: "14px",
                  backgroundColor: "#5d94f8",
                  borderRadius: "50%",
                  marginRight: "10px",
                }}
              ></span>
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
              <span
                style={{
                  display: "inline-block",
                  width: "14px",
                  height: "14px",
                  backgroundColor: "#e95daa",
                  borderRadius: "50%",
                  marginRight: "10px",
                }}
              ></span>
              <Form.Check
                type="checkbox"
                label="Legal"
                checked={filters.pink}
                onChange={() => handleFilterChange("pink")}
                id="filter-pink"
                className="mb-0"
              />
            </div>
            <div className="d-flex align-items-center mt-3">
              <Form.Label className="mb-0 me-2" style={{ fontWeight: 500 }}>
                Distance
              </Form.Label>
              <Form.Control
                type="number"
                step="any"
                min="1"
                style={{ width: "80px", padding: "0.25rem 0.5rem" }}
                className="me-2 text-center"
                value={distanceInputVal}
                onChange={handleDistanceChange}
                ref={distanceInputRef}
                isInvalid={!!distanceErrorMsg}
                onClick={() => {
                  if (!userLocation) {
                    setShowAddressModal(true);
                  }
                }}
              />
              <span style={{ fontWeight: 500 }}>miles</span>
            </div>
            {distanceErrorMsg && (
              <div className="text-danger mt-1" style={{ fontSize: "0.85rem" }}>
                {distanceErrorMsg}
              </div>
            )}

            {!gpsActive && (
              <div className="mt-3">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="w-100"
                  onClick={() => setShowAddressModal(true)}
                >
                  Set my location
                </Button>
              </div>
            )}
          </Form>
        )}
      </div>

      {/* Address Prompt Modal */}
      <Modal
        show={showAddressModal}
        onHide={() => {
          setShowAddressModal(false);
          if (!userLocation && distanceInputRef.current) {
            distanceInputRef.current.blur();
          }
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ color: "var(--gold)" }}>
            Your Location
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p
            className="text-muted"
            style={{ fontSize: "0.9rem", fontWeight: 500 }}
          >
            For safety, enter an address near your location rather than where
            you live.
          </p>
          <Form onSubmit={handleAddressSubmit}>
            <Form.Group>
              <Form.Label>
                Please provide an address, zip code, or city:
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. 123 Main St, Atlanta, GA"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                isInvalid={!!addressError}
                autoFocus
              />
              <Form.Control.Feedback type="invalid">
                {addressError}
              </Form.Control.Feedback>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowAddressModal(false);
              if (!userLocation && distanceInputRef.current) {
                distanceInputRef.current.blur();
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddressSubmit}
            style={{
              backgroundColor: "var(--gold)",
              borderColor: "var(--gold)",
              color: "black",
              fontWeight: 500,
            }}
          >
            Center Map
          </Button>
        </Modal.Footer>
      </Modal>

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
            let hexColor = "";
            if (pin.color === "yellow") hexColor = "#fff579";
            else if (pin.color === "green") hexColor = "#00e85f";
            else if (pin.color === "blue") hexColor = "#5d94f8";
            else if (pin.color === "pink") hexColor = "#e95daa";

            return (
              <AdvancedMarker
                key={pin.id}
                position={pin.position}
                title={pin.name}
                onClick={() => setSelectedPin(pin)}
              >
                <Pin
                  background={hexColor}
                  borderColor={"#333"}
                  glyphColor={"#333"}
                />
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
