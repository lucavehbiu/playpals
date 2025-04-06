import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sportTypes } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { X } from "lucide-react";

// Form schema based on shared schema with additional validation
const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  sportType: z.enum(sportTypes),
  date: z.string(),
  time: z.string(),
  location: z.string().min(3, "Please provide a valid location"),
  maxParticipants: z.number().int().min(2, "Need at least 2 participants"),
  isPublic: z.preprocess(
    (value) => value === "true" || value === true,
    z.boolean().default(true)
  ),
  isFree: z.preprocess(
    (value) => value === "true" || value === true,
    z.boolean().default(true)
  ),
  cost: z.number().optional(),
});

type CreateEventFormData = z.infer<typeof createEventSchema>;

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
}

const CreateEventModal = ({ isOpen, onClose, onEventCreated }: CreateEventModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showCost, setShowCost] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      sportType: "basketball",
      date: new Date().toISOString().split("T")[0],
      time: "18:00",
      location: "",
      maxParticipants: 10,
      isPublic: true,
      isFree: true,
      cost: 0,
    }
  });
  
  // Watch the isFree field to show/hide cost field
  const isFree = watch("isFree");
  
  const createEventMutation = useMutation({
    mutationFn: async (data: CreateEventFormData) => {
      // Combine date and time
      const dateTime = new Date(`${data.date}T${data.time}`);
      
      // Make sure boolean values are properly set
      const isPublic = data.isPublic === undefined ? true : !!data.isPublic;
      const isFree = data.isFree === undefined ? true : !!data.isFree;
      
      // Format the data for the API
      const eventData = {
        title: data.title,
        description: data.description || "",
        sportType: data.sportType,
        date: dateTime.toISOString(),
        location: data.location,
        maxParticipants: data.maxParticipants,
        isPublic: isPublic,
        isFree: isFree,
        cost: !isFree && data.cost ? Math.round(data.cost * 100) : 0, // Convert to cents
        // The creatorId will be set from the authenticated user on the server
      };
      
      const response = await apiRequest("POST", "/api/events", eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events/user'] });
      toast({
        title: "Success!",
        description: "Event created successfully",
      });
      reset();
      if (onEventCreated) onEventCreated();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create event: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: CreateEventFormData) => {
    createEventMutation.mutate(data);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
      
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* This element is to trick the browser into centering the modal contents. */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>
        
        {/* Modal content */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Modal header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Create New Event</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={onClose}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Form */}
            <div className="mt-4">
              <form id="create-event-form" className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Event Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g. Weekend Basketball Game"
                    {...register("title")}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="sportType" className="block text-sm font-medium text-gray-700">
                    Sport/Activity
                  </label>
                  <select
                    id="sportType"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    {...register("sportType")}
                  >
                    <option value="">Select sport or activity</option>
                    {sportTypes.map(sport => (
                      <option key={sport} value={sport}>
                        {sport.charAt(0).toUpperCase() + sport.slice(1)}
                      </option>
                    ))}
                  </select>
                  {errors.sportType && (
                    <p className="mt-1 text-sm text-red-600">{errors.sportType.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      type="date"
                      id="date"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      {...register("date")}
                    />
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                      Time
                    </label>
                    <input
                      type="time"
                      id="time"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      {...register("time")}
                    />
                    {errors.time && (
                      <p className="mt-1 text-sm text-red-600">{errors.time.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${errors.location ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Search for a venue"
                    {...register("location")}
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                  )}
                  {/* Map would be integrated here */}
                  <div className="mt-2 h-36 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-sm">
                    Map View - Select Location
                  </div>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Provide details about your event"
                    {...register("description")}
                  ></textarea>
                </div>
                
                <div>
                  <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700">
                    Maximum Participants
                  </label>
                  <input
                    type="number"
                    id="maxParticipants"
                    min="2"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    {...register("maxParticipants", { valueAsNumber: true })}
                  />
                  {errors.maxParticipants && (
                    <p className="mt-1 text-sm text-red-600">{errors.maxParticipants.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Event Visibility
                  </label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <input
                        id="visibility-public"
                        type="radio"
                        className="focus:ring-primary h-4 w-4 text-primary border-gray-300"
                        checked={watch("isPublic") === true}
                        onChange={() => setValue("isPublic", true)}
                      />
                      <label htmlFor="visibility-public" className="ml-3 block text-sm font-medium text-gray-700">
                        Public (Anyone can join)
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="visibility-private"
                        type="radio"
                        className="focus:ring-primary h-4 w-4 text-primary border-gray-300"
                        checked={watch("isPublic") === false}
                        onChange={() => setValue("isPublic", false)}
                      />
                      <label htmlFor="visibility-private" className="ml-3 block text-sm font-medium text-gray-700">
                        Private (Invite only)
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="is-free"
                    type="checkbox"
                    className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"
                    checked={isFree}
                    onChange={(e) => {
                      setValue("isFree", e.target.checked);
                      setShowCost(!e.target.checked);
                    }}
                  />
                  <label htmlFor="is-free" className="ml-3 block text-sm font-medium text-gray-700">
                    This is a free event
                  </label>
                </div>
                
                {!isFree && (
                  <div>
                    <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
                      Cost per Person ($)
                    </label>
                    <input
                      type="number"
                      id="cost"
                      step="0.01"
                      min="0"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="0.00"
                      {...register("cost", { valueAsNumber: true })}
                      onChange={(e) => setValue("cost", parseFloat(e.target.value) || 0)}
                    />
                    {errors.cost && (
                      <p className="mt-1 text-sm text-red-600">{errors.cost.message}</p>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>
          
          {/* Modal footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              form="create-event-form"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm"
              disabled={createEventMutation.isPending}
            >
              {createEventMutation.isPending ? "Creating..." : "Create Event"}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEventModal;
