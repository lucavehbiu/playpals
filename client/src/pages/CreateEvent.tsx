import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, CalendarIcon, MapPinIcon, Users, Clock, Globe, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

const CreateEvent = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Event form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sportType, setSportType] = useState("basketball");
  const [eventLocation, setEventLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [isPrivate, setIsPrivate] = useState(false);
  const [price, setPrice] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  
  // Mutation for creating an event
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      return apiRequest('/api/events', 'POST', eventData);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your event has been created.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      if (user) {
        queryClient.invalidateQueries({ queryKey: [`/api/events/user/${user.id}`] });
      }
      setLocation("/myevents");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create event. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create an event.",
        variant: "destructive",
      });
      return;
    }
    
    if (!title || !sportType || !eventLocation || !date || !time) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Combine date and time
    const startDateTime = new Date(`${date}T${time}`);
    
    // Calculate end time based on duration
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
    
    const eventData = {
      title,
      description,
      sportType,
      location: eventLocation,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      maxParticipants,
      creatorId: user.id,
      isPrivate,
      price: parseFloat(price) || 0,
      imageUrl: imageUrl || undefined,
    };
    
    createEventMutation.mutate(eventData);
  };
  
  const goBack = () => {
    setLocation("/myevents");
  };
  
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="p-0 mr-2" 
          onClick={goBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Create Event</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 shadow rounded-lg space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 col-span-2">
              <Label htmlFor="title">Event Title <span className="text-red-500">*</span></Label>
              <Input 
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your event a catchy title"
                className="w-full"
                required
              />
            </div>
            
            <div className="space-y-3 col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your event, what to expect, what to bring..."
                className="min-h-[120px]"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="sportType">Sport Type <span className="text-red-500">*</span></Label>
              <Select value={sportType} onValueChange={setSportType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basketball">Basketball</SelectItem>
                  <SelectItem value="soccer">Soccer</SelectItem>
                  <SelectItem value="tennis">Tennis</SelectItem>
                  <SelectItem value="volleyball">Volleyball</SelectItem>
                  <SelectItem value="badminton">Badminton</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="cycling">Cycling</SelectItem>
                  <SelectItem value="hiking">Hiking</SelectItem>
                  <SelectItem value="yoga">Yoga</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input 
                  id="location"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Where is this event taking place?"
                  className="w-full pl-10"
                  required
                />
                <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input 
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10"
                  required
                  min={format(new Date(), "yyyy-MM-dd")}
                />
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="time">Start Time <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input 
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-10"
                  required
                />
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select 
                value={duration.toString()} 
                onValueChange={(val) => setDuration(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How long is the event?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="180">3 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="maxParticipants">Maximum Participants</Label>
              <div className="relative">
                <Input 
                  id="maxParticipants"
                  type="number"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                  min={2}
                  max={100}
                  className="w-full pl-10"
                />
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="imageUrl">Event Image URL (optional)</Label>
            <Input 
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Link to an image for your event"
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isPrivate" className="text-base">Private Event</Label>
                <p className="text-sm text-gray-500">Only invited users can see and join</p>
              </div>
              <div className="flex items-center">
                {isPrivate ? (
                  <Lock className="mr-2 h-4 w-4 text-gray-500" />
                ) : (
                  <Globe className="mr-2 h-4 w-4 text-gray-500" />
                )}
                <Switch
                  id="isPrivate"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="price">Price (optional)</Label>
              <Input 
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full"
              />
              <p className="text-sm text-gray-500">Leave at 0 for free events</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white"
            disabled={createEventMutation.isPending}
          >
            {createEventMutation.isPending ? "Creating..." : "Create Event"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;