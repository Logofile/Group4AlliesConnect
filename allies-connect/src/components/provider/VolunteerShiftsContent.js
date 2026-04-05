import { useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import "../../App.css";
import { API_URL, useTableDataProcessing } from "./providerHelpers";

function VolunteerShiftsContent({ onViewDetails, providerId }) {
  const [opportunities, setOpportunities] = useState([]);
  const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } =
    useTableDataProcessing(opportunities, "title");

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/volunteer-opportunities?provider_id=${providerId}`,
      );
      const data = await response.json();
      setOpportunities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching volunteer opportunities:", error);
      setOpportunities([]);
    }
  };

  return (
    <>
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Search by opportunity title"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Table hover className="text-center">
        <thead>
          <tr>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("title")}
            >
              Opportunity {sortSymbol("title")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("status")}
            >
              Status {sortSymbol("status")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("contact_name")}
            >
              Contact {sortSymbol("contact_name")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("city")}
            >
              Location {sortSymbol("city")}
            </th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-muted">
                No volunteer shifts found.
              </td>
            </tr>
          ) : (
            sortedData.map((opp) => (
              <tr key={opp.opportunity_id} className="text-center align-middle">
                <td>{opp.title}</td>
                <td>{opp.status}</td>
                <td>{opp.contact_name}</td>
                <td>
                  {opp.city}, {opp.state}
                </td>
                <td>
                  <button
                    className="outline-warning me-2"
                    onClick={() => onViewDetails("volunteerShifts", opp)}
                  >
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

export default VolunteerShiftsContent;
