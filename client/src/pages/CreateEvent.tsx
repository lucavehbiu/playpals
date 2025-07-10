import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, ArrowRight, CalendarIcon, MapPinIcon, Users, Clock, Globe, Lock, UserPlus, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import InviteFriendsModal from "@/components/event/InviteFriendsModal";

const STEPS = [
  { id: 'title', label: 'Event Title', icon: '📝' },
  { id: 'sport', label: 'Sport Type', icon: '⚽' },
  { id: 'location', label: 'Location', icon: '📍' },
  { id: 'date', label: 'Date', icon: '📅' },
  { id: 'time', label: 'Start Time', icon: '⏰' },
  { id: 'duration', label: 'Duration', icon: '⏱️' },
  { id: 'players', label: 'Min Players', icon: '👥' },
  { id: 'price', label: 'Price', icon: '💰' },
  { id: 'description', label: 'Description', icon: '📄' },
  { id: 'visibility', label: 'Public/Private', icon: '🔒' }
];

const CreateEvent = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Get parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get('groupId') ? parseInt(urlParams.get('groupId')!) : null;
  const pollId = urlParams.get('pollId') ? parseInt(urlParams.get('pollId')!) : null;
  const suggestionId = urlParams.get('suggestionId') ? parseInt(urlParams.get('suggestionId')!) : null;
  
  // Step management
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  // Event form state
  const [formData, setFormData] = useState({
    title: urlParams.get('title') || "",
    sportType: "basketball",
    location: "",
    date: urlParams.get('date') || "",
    time: urlParams.get('time') || "",
    duration: "60",
    maxParticipants: urlParams.get('maxParticipants') || "10",
    price: "0",
    description: urlParams.get('description') || "",
    isPrivate: groupId ? true : false
  });
  
  // Friend invitation modal state
  const [inviteFriendsModalOpen, setInviteFriendsModalOpen] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<number | null>(null);
  
  // Mutation for creating an event
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await apiRequest('POST', '/api/events', eventData);
      const result = await response.json();
      
      // If event was created for a group, link it to the group
      if (groupId && result?.id) {
        await apiRequest('POST', `/api/sports-groups/${groupId}/events`, {
          eventId: result.id
        });
      }
      
      return result;
    },
    onSuccess: async (data: any) => {
      toast({
        title: "Success!",
        description: groupId ? "Your group event has been created." : "Your event has been created.",
      });
      
      // If event was created from a poll suggestion, mark the suggestion as used and invite available participants
      if (pollId && suggestionId && data?.id) {
        try {
          // Mark the poll suggestion as used
          await fetch(`/api/sports-groups/${groupId}/polls/${pollId}/suggestions/${suggestionId}/mark-used`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ eventId: data.id }),
          });

          // Invite all users who marked themselves as available for this time slot
          await fetch(`/api/sports-groups/${groupId}/polls/${pollId}/invite-available-users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ 
              eventId: data.id, 
              timeSlotId: suggestionId 
            }),
          });
        } catch (error) {
          console.error('Failed to process poll suggestion:', error);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      if (user) {
        queryClient.invalidateQueries({ queryKey: [`/api/events/user/${user.id}`] });
      }
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: [`/api/sports-groups/${groupId}/events`] });
        queryClient.invalidateQueries({ queryKey: ['sports-groups', groupId, 'polls'] });
      }
      
      // If it's a group event, navigate back to group (no invite modal needed)
      if (groupId) {
        setLocation(`/groups/${groupId}`);
      } else if (formData.isPrivate && data?.id) {
        // Only show invite friends modal for non-group private events
        setCreatedEventId(data.id);
        setInviteFriendsModalOpen(true);
      } else {
        // Navigate to my events for public events
        setLocation("/myevents");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create event. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const isStepValid = (stepIndex: number) => {
    const step = STEPS[stepIndex];
    switch (step.id) {
      case 'title':
        return formData.title.trim().length > 0;
      case 'sport':
        return formData.sportType.length > 0;
      case 'location':
        return formData.location.trim().length > 0;
      case 'date':
        return formData.date.length > 0;
      case 'time':
        return formData.time.length > 0;
      case 'duration':
        return formData.duration.length > 0;
      case 'players':
        return parseInt(formData.maxParticipants) >= 2;
      case 'price':
        return parseFloat(formData.price) >= 0;
      case 'description':
        return true; // Optional field
      case 'visibility':
        return true; // Always valid
      default:
        return false;
    }
  };
  
  const handleNext = () => {
    if (isStepValid(currentStep)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const handleSubmit = () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create an event.",
        variant: "destructive",
      });
      return;
    }
    
    // Combine date and time
    const startDateTime = new Date(`${formData.date}T${formData.time}`);
    
    // Calculate end time based on duration
    const endDateTime = new Date(startDateTime.getTime() + parseInt(formData.duration) * 60000);
    
    const eventData = {
      title: formData.title,
      description: formData.description,
      sportType: formData.sportType,
      location: formData.location,
      date: startDateTime.toISOString(),
      maxParticipants: parseInt(formData.maxParticipants) || 10,
      creatorId: user.id,
      isPublic: !formData.isPrivate,
      isFree: parseFloat(formData.price) === 0,
      cost: Math.round((parseFloat(formData.price) || 0) * 100), // Convert to cents for backend
    };
    
    createEventMutation.mutate(eventData);
  };
  
  const goBack = () => {
    setLocation("/myevents");
  };

  const handleInviteFriendsClose = () => {
    setInviteFriendsModalOpen(false);
    setCreatedEventId(null);
    setLocation("/myevents");
  };
  
  const renderCurrentStep = () => {
    const step = STEPS[currentStep];
    
    switch (step.id) {
      case 'title':
        return (
          <div className="space-y-4">
            <Label htmlFor="title" className="text-lg font-medium">What's the name of your event?</Label>
            <Input 
              id="title"
              value={formData.title}
              onChange={(e) => updateFormData('title', e.target.value)}
              placeholder="e.g., Weekend Basketball Pickup Game"
              className="text-lg p-4 h-14"
              autoFocus
            />
          </div>
        );
        
      case 'sport':
        return (
          <div className="space-y-4">
            <Label className="text-lg font-medium">What sport will you be playing?</Label>
            <Select value={formData.sportType} onValueChange={(value) => updateFormData('sportType', value)}>
              <SelectTrigger className="text-lg p-4 h-14">
                <SelectValue placeholder="Select a sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basketball">🏀 Basketball</SelectItem>
                <SelectItem value="soccer">⚽ Soccer</SelectItem>
                <SelectItem value="tennis">🎾 Tennis</SelectItem>
                <SelectItem value="volleyball">🏐 Volleyball</SelectItem>
                <SelectItem value="badminton">🏸 Badminton</SelectItem>
                <SelectItem value="running">🏃 Running</SelectItem>
                <SelectItem value="cycling">🚴 Cycling</SelectItem>
                <SelectItem value="hiking">🥾 Hiking</SelectItem>
                <SelectItem value="yoga">🧘 Yoga</SelectItem>
                <SelectItem value="other">🎯 Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
        
      case 'location':
        return (
          <div className="space-y-4">
            <Label htmlFor="location" className="text-lg font-medium">Where will this take place?</Label>
            <div className="relative">
              <Input 
                id="location"
                value={formData.location}
                onChange={(e) => updateFormData('location', e.target.value)}
                placeholder="e.g., Central Park Basketball Court"
                className="text-lg p-4 h-14 pl-12"
                autoFocus
              />
              <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
        );
        
      case 'date':
        return (
          <div className="space-y-4">
            <Label htmlFor="date" className="text-lg font-medium">When is your event?</Label>
            <div className="relative">
              <Input 
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => updateFormData('date', e.target.value)}
                className="text-lg p-4 h-14 pl-12"
                min={format(new Date(), "yyyy-MM-dd")}
                autoFocus
              />
              <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
        );
        
      case 'time':
        return (
          <div className="space-y-4">
            <Label htmlFor="time" className="text-lg font-medium">What time does it start?</Label>
            <div className="relative">
              <Input 
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => updateFormData('time', e.target.value)}
                className="text-lg p-4 h-14 pl-12"
                autoFocus
              />
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
        );
        
      case 'duration':
        return (
          <div className="space-y-4">
            <Label className="text-lg font-medium">How long will it last?</Label>
            <Select value={formData.duration} onValueChange={(value) => updateFormData('duration', value)}>
              <SelectTrigger className="text-lg p-4 h-14">
                <SelectValue placeholder="Select duration" />
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
        );
        
      case 'players':
        return (
          <div className="space-y-4">
            <Label htmlFor="maxParticipants" className="text-lg font-medium">How many players do you need?</Label>
            <div className="relative">
              <Input 
                id="maxParticipants"
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => updateFormData('maxParticipants', e.target.value)}
                min={2}
                max={100}
                className="text-lg p-4 h-14 pl-12"
                placeholder="e.g., 10"
                autoFocus
              />
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
        );
        
      case 'price':
        return (
          <div className="space-y-4">
            <Label htmlFor="price" className="text-lg font-medium">What's the cost per person?</Label>
            <div className="relative">
              <Input 
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => updateFormData('price', e.target.value)}
                min={0}
                step="0.01"
                className="text-lg p-4 h-14 pl-12"
                placeholder="0.00"
                autoFocus
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
            </div>
            <p className="text-sm text-gray-500">Enter 0 for free events</p>
          </div>
        );
        
      case 'description':
        return (
          <div className="space-y-4">
            <Label htmlFor="description" className="text-lg font-medium">Tell people about your event (optional)</Label>
            <Textarea 
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Describe what to expect, what to bring, skill level, etc..."
              className="text-lg p-4 min-h-[120px] resize-none"
              autoFocus
            />
          </div>
        );
        
      case 'visibility':
        return (
          <div className="space-y-6">
            <Label className="text-lg font-medium">Who can see and join your event?</Label>
            <div className="space-y-4">
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  !formData.isPrivate 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => updateFormData('isPrivate', false)}
              >
                <div className="flex items-center space-x-3">
                  <Globe className="h-6 w-6 text-blue-500" />
                  <div>
                    <h3 className="font-medium text-lg">Public Event</h3>
                    <p className="text-gray-600">Anyone can see and join this event</p>
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.isPrivate 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => updateFormData('isPrivate', true)}
              >
                <div className="flex items-center space-x-3">
                  <Lock className="h-6 w-6 text-orange-500" />
                  <div>
                    <h3 className="font-medium text-lg">Private Event</h3>
                    <p className="text-gray-600">Only invited people can see and join</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <Button 
          variant="ghost" 
          className="p-2" 
          onClick={currentStep === 0 ? goBack : handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Create Event</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>
      
      {/* Progress Bar */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Step {currentStep + 1} of {STEPS.length}</span>
          <span className="text-sm text-gray-500">{Math.round(((currentStep + 1) / STEPS.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Step Indicator */}
      <div className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <span className="text-3xl">{STEPS[currentStep].icon}</span>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{STEPS[currentStep].label}</h2>
            <p className="text-gray-500">Step {currentStep + 1} of {STEPS.length}</p>
          </div>
        </div>
      </div>
      
      {/* Current Step Content */}
      <div className="px-6 py-8 flex-1">
        {renderCurrentStep()}
      </div>
      
      {/* Navigation Buttons */}
      <div className="sticky bottom-0 bg-white border-t p-6">
        <div className="flex justify-between space-x-4">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex-1"
          >
            Back
          </Button>
          <Button 
            onClick={handleNext}
            disabled={!isStepValid(currentStep) || createEventMutation.isPending}
            className="flex-1"
          >
            {createEventMutation.isPending ? (
              "Creating..."
            ) : currentStep === STEPS.length - 1 ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Create Event
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Invite Friends Modal */}
      {inviteFriendsModalOpen && createdEventId && (
        <InviteFriendsModal
          eventId={createdEventId}
          onClose={handleInviteFriendsClose}
        />
      )}
    </div>
  );
};

export default CreateEvent;