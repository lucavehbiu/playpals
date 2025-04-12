import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Event } from "@/lib/types";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  CalendarIcon, 
  ArrowLeft, 
  Loader2,
  CheckIcon,
  Image as ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Form schema
const eventFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  sportType: z.string().min(1, { message: "Please select a sport type" }),
  date: z.date({ required_error: "Please select a date and time" }),
  time: z.string({ required_error: "Please select a time" }),
  location: z.string().min(3, { message: "Location must be at least 3 characters" }),
  maxParticipants: z.coerce.number().min(1, { message: "At least 1 participant is required" }),
  isPublic: z.boolean().default(true),
  isFree: z.boolean().default(true),
  cost: z.coerce.number().min(0).optional(),
  eventImage: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const EditEvent = () => {
  const { id } = useParams();
  const eventId = parseInt(id as string);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch event details
  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !isNaN(eventId),
  });
  
  // Form setup
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      sportType: "",
      date: new Date(),
      time: "12:00",
      location: "",
      maxParticipants: 1,
      isPublic: true,
      isFree: true,
      cost: 0,
      eventImage: "",
    },
  });
  
  // Update form with event data once loaded
  useEffect(() => {
    if (event) {
      const eventDate = new Date(event.date);
      const hours = eventDate.getHours().toString().padStart(2, '0');
      const minutes = eventDate.getMinutes().toString().padStart(2, '0');
      
      form.reset({
        title: event.title,
        description: event.description || "",
        sportType: event.sportType,
        date: eventDate,
        time: `${hours}:${minutes}`,
        location: event.location,
        maxParticipants: event.maxParticipants,
        isPublic: event.isPublic,
        isFree: event.isFree,
        cost: event.cost ? event.cost / 100 : 0, // Convert cents to dollars for display
        eventImage: event.eventImage || "",
      });
    }
  }, [event, form]);
  
  // Check if user is authorized to edit this event
  useEffect(() => {
    if (event && user && event.creatorId !== user.id) {
      toast({
        title: "Unauthorized",
        description: "You don't have permission to edit this event",
        variant: "destructive",
      });
      setLocation(`/events/${eventId}`);
    }
  }, [event, user, eventId, setLocation, toast]);
  
  // Update event mutation
  const updateMutation = useMutation({
    mutationFn: async (formData: EventFormValues) => {
      // Combine date and time
      const dateTime = new Date(formData.date);
      const [hours, minutes] = formData.time.split(':').map(Number);
      dateTime.setHours(hours, minutes);
      
      // Convert cost from dollars to cents
      const costInCents = formData.isFree ? null : Math.round((formData.cost || 0) * 100);
      
      const eventData = {
        title: formData.title,
        description: formData.description,
        sportType: formData.sportType,
        date: dateTime.toISOString(),
        location: formData.location,
        maxParticipants: formData.maxParticipants,
        isPublic: formData.isPublic,
        isFree: formData.isFree,
        cost: costInCents,
        eventImage: formData.eventImage,
      };
      
      await apiRequest("PUT", `/api/events/${eventId}`, eventData);
    },
    onSuccess: () => {
      toast({
        title: "Event Updated",
        description: "Your event has been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/user/${user?.id}`] });
      setLocation(`/events/manage/${eventId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update event: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: EventFormValues) => {
    updateMutation.mutate(values);
  };
  
  const goBack = () => {
    setLocation(`/events/manage/${eventId}`);
  };
  
  // Sport types available in the application
  const sportTypes = [
    "basketball", "soccer", "tennis", "volleyball", 
    "cycling", "yoga", "running", "swimming", 
    "football", "baseball", "hiking", "golf"
  ];
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !event) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Button variant="ghost" onClick={() => setLocation("/myevents")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Events
        </Button>
        <div className="text-center p-8 bg-red-50 rounded-lg">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Event</h2>
          <p className="text-red-600">
            {error instanceof Error ? error.message : "Event not found or you don't have permission to edit it"}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      <Button variant="ghost" onClick={goBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event Management
      </Button>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Event</h1>
        <p className="text-gray-500">Update the details of your event</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Provide the essential details about your event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a descriptive title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your event, what to expect, what to bring, etc." 
                        {...field} 
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sportType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sport / Activity Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a sport" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sportTypes.map(sport => (
                          <SelectItem key={sport} value={sport}>
                            {sport.charAt(0).toUpperCase() + sport.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter address or venue name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Participation & Visibility</CardTitle>
              <CardDescription>Set who can join and how many people can attend</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="maxParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Participants</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Set a limit based on venue capacity or activity requirements
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Public Event</FormLabel>
                      <FormDescription>
                        Allow anyone to discover and join your event
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>Set fees or make your event free</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="isFree"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Free Event</FormLabel>
                      <FormDescription>
                        No participation fee for attendees
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {!form.watch("isFree") && (
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost per Participant ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          disabled={form.watch("isFree")}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter price in dollars (e.g., 5.00)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Event Image</CardTitle>
              <CardDescription>Add a cover image for your event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="eventImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter image URL" {...field} />
                    </FormControl>
                    <FormDescription>
                      Paste a URL to an image or leave blank for a default image based on sport type
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.watch("eventImage") && (
                <div className="mt-2">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                    <img
                      src={form.watch("eventImage")}
                      alt="Event preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://source.unsplash.com/random/800x600/?${form.watch("sportType") || 'sport'}`;
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={goBack}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="flex gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EditEvent;