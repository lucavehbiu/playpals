import { useState } from "react";
import { PlusIcon } from "lucide-react";
import CreateEventModal from "./CreateEventModal";

interface CreateEventButtonProps {
  onEventCreated?: () => void;
  centered?: boolean;
  fullWidth?: boolean;
}

const CreateEventButton = ({ 
  onEventCreated, 
  centered = false,
  fullWidth = false 
}: CreateEventButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  
  const handleEventCreated = () => {
    closeModal();
    if (onEventCreated) onEventCreated();
  };

  // Build the button classes based on props
  const buttonClasses = [
    "inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
    centered ? "mx-auto" : "",
    fullWidth ? "w-full justify-center" : ""
  ].filter(Boolean).join(" ");
  
  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={buttonClasses}
      >
        <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
        Create Event
      </button>

      <CreateEventModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        onEventCreated={handleEventCreated} 
      />
    </>
  );
};

export default CreateEventButton;
