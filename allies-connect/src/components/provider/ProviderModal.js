import { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import "../../App.css";
import CreateEventContent from "./CreateEventContent";
import CreateResourceContent from "./CreateResourceContent";
import EditEventsContent from "./EditEventsContent";
import EditResourcesContent from "./EditResourcesContent";
import ExportHoursContent from "./ExportHoursContent";
import ProviderDetailsModal from "./ProviderDetailsModal";
import VolunteerShiftsContent from "./VolunteerShiftsContent";

const MODAL_TYPE = {
  createEvent: {
    title: "Create Event",
    Content: CreateEventContent,
  },
  editEvents: {
    title: "Edit Events",
    Content: EditEventsContent,
  },
  createResource: {
    title: "Create Resource",
    Content: CreateResourceContent,
  },
  editResources: {
    title: "Edit Resources",
    Content: EditResourcesContent,
  },
  volunteerShifts: {
    title: "Volunteer Shift Management",
    Content: VolunteerShiftsContent,
  },
  exportHours: {
    title: "Export Volunteer Hours",
    Content: ExportHoursContent,
  },
};

function ProviderModal({ show, onHide, type, providerId, userId }) {
  const [detailModalType, setDetailModalType] = useState("");
  const [selectedData, setSelectedData] = useState(null);
  const config = MODAL_TYPE[type];

  // Increment a key each time the modal opens so content components remount
  // and re-fetch fresh data
  const [openKey, setOpenKey] = useState(0);
  const prevShow = useRef(false);
  useEffect(() => {
    if (show && !prevShow.current) {
      setOpenKey((k) => k + 1);
    }
    prevShow.current = show;
  }, [show]);

  const handleViewDetails = (detailType, data) => {
    setSelectedData(data);
    setDetailModalType(detailType);
  };

  const modalClass =
    type === "createEvent" || type === "createResource"
      ? "modal-half"
      : "modal-wide";

  return (
    <Modal show={show} className={modalClass} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{config?.title || ""}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {config && (
          <config.Content
            key={openKey}
            onViewDetails={handleViewDetails}
            providerId={providerId}
            userId={userId}
          />
        )}
      </Modal.Body>
      <ProviderDetailsModal
        show={!!detailModalType}
        type={detailModalType}
        data={selectedData}
        onHide={() => {
          setDetailModalType("");
          setSelectedData(null);
        }}
      />
    </Modal>
  );
}

export default ProviderModal;
