// @ts-nocheck
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  MapPinIcon,
  Users,
  Clock,
  Globe,
  Lock,
  UserPlus,
  CheckCircle,
  DollarSign,
  Upload,
  Sparkles,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import InviteFriendsModal from '@/components/event/InviteFriendsModal';
import { LeafletMapWrapper } from '@/components/maps/LeafletMapWrapper';
import { LeafletLocationSearch } from '@/components/maps/LeafletLocationSearch';
import LeafletEventMap from '@/components/maps/LeafletEventMap';
import { sportTypes } from '@shared/schema';
import { motion, AnimatePresence } from 'framer-motion';

// Import our new premium components
import { StepIndicator } from '@/components/create-event/StepIndicator';
import { EventPreviewCard } from '@/components/create-event/EventPreviewCard';
import { FormField } from '@/components/create-event/FormField';
import { SportSelector } from '@/components/create-event/SportSelector';
import { DateTimePicker } from '@/components/create-event/DateTimePicker';
import { SuccessConfetti } from '@/components/create-event/SuccessConfetti';

const STEPS = [
  { id: 'basics', label: 'Basics', icon: '📝' },
  { id: 'sport', label: 'Sport', icon: '⚽' },
  { id: 'datetime', label: 'When', icon: '📅' },
  { id: 'location', label: 'Where', icon: '📍' },
  { id: 'details', label: 'Details', icon: '👥' },
  { id: 'image', label: 'Image', icon: '🖼️' },
  { id: 'visibility', label: 'Privacy', icon: '🔒' },
];

const CreateEvent = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Get parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get('groupId') ? parseInt(urlParams.get('groupId')!) : null;
  const pollId = urlParams.get('pollId') ? parseInt(urlParams.get('pollId')!) : null;
  const suggestionId = urlParams.get('suggestionId')
    ? parseInt(urlParams.get('suggestionId')!)
    : null;

  // Step management
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  // Event form state
  const [formData, setFormData] = useState({
    title: urlParams.get('title') || '',
    sportType: 'basketball',
    location: '',
    locationLatitude: 0,
    locationLongitude: 0,
    date: urlParams.get('date') || '',
    time: urlParams.get('time') || '',
    duration: '60',
    maxParticipants: urlParams.get('maxParticipants') || '10',
    price: '0',
    description: urlParams.get('description') || '',
    eventImage: '',
    isPrivate: groupId ? true : false,
  });

  // Friend invitation modal state
  const [inviteFriendsModalOpen, setInviteFriendsModalOpen] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<number | null>(null);

  // Image generation state
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Mutation for generating event images (SVG - stays as data URL)
  const generateImageMutation = useMutation({
    mutationFn: async ({ sportType, title }: { sportType: string; title: string }) => {
      setIsGeneratingImage(true);
      const response = await apiRequest('POST', '/api/generate-event-image', {
        sportType,
        title,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.imageUrl) {
        setImagePreview(data.imageUrl);
        setFormData((prev) => ({ ...prev, eventImage: data.imageUrl }));
      }
      setIsGeneratingImage(false);
    },
    onError: () => {
      setIsGeneratingImage(false);
      toast({
        title: 'Error',
        description: 'Failed to generate image. Please try uploading one instead.',
        variant: 'destructive',
      });
    },
  });

  // Store uploaded file for later GCS upload
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);

  // Function to upload image to GCS after event creation
  const uploadImageToGCS = async (eventId: number, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`/api/events/${eventId}/image`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to upload image to GCS');
    }

    const data = await response.json();
    return data.imageUrl;
  };

  // Mutation for creating an event
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await apiRequest('POST', '/api/events', eventData);
      const result = await response.json();

      // If event was created for a group, link it to the group
      if (groupId && result?.id) {
        await apiRequest('POST', `/api/sports-groups/${groupId}/events`, {
          eventId: result.id,
        });
      }

      // If user uploaded a photo (not SVG), upload it to GCS now
      if (uploadedImageFile && result?.id) {
        try {
          console.log('Uploading image to GCS for event:', result.id);
          const gcsUrl = await uploadImageToGCS(result.id, uploadedImageFile);
          console.log('Image uploaded successfully to:', gcsUrl);
        } catch (error) {
          console.error('Failed to upload image to GCS:', error);
        }
      }

      return result;
    },
    onSuccess: async (data: any) => {
      // Show confetti!
      setShowConfetti(true);

      toast({
        title: 'Success!',
        description: groupId
          ? 'Your group event has been created.'
          : 'Your event has been created.',
      });

      // If event was created from a poll suggestion, mark the suggestion as used and invite available participants
      if (pollId && suggestionId && data?.id) {
        try {
          await fetch(
            `/api/sports-groups/${groupId}/polls/${pollId}/suggestions/${suggestionId}/mark-used`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ eventId: data.id }),
            }
          );

          await fetch(`/api/sports-groups/${groupId}/polls/${pollId}/invite-available-users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              eventId: data.id,
              timeSlotId: suggestionId,
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

      // Wait for confetti, then navigate
      setTimeout(() => {
        if (groupId) {
          setLocation(`/groups/${groupId}`);
        } else if (formData.isPrivate && data?.id) {
          setCreatedEventId(data.id);
          setInviteFriendsModalOpen(true);
        } else {
          setLocation('/myevents');
        }
      }, 2500);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create event. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isStepValid = (stepIndex: number) => {
    const step = STEPS[stepIndex];
    switch (step.id) {
      case 'basics':
        return formData.title.trim().length > 0;
      case 'sport':
        return formData.sportType.length > 0;
      case 'datetime':
        return formData.date.length > 0 && formData.time.length > 0;
      case 'location':
        return formData.location.trim().length > 0;
      case 'details':
        return parseInt(formData.maxParticipants) >= 2 && parseFloat(formData.price) >= 0;
      case 'image':
        return true; // Optional
      case 'visibility':
        return true; // Always valid
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isStepValid(currentStep)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps((prev) => [...prev, currentStep]);
      }

      if (currentStep < STEPS.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create an event.',
        variant: 'destructive',
      });
      return;
    }

    // If it's a private event and not from a group, navigate to invitation page
    if (formData.isPrivate && !groupId) {
      const eventData = {
        title: formData.title,
        description: formData.description,
        sportType: formData.sportType,
        location: formData.location,
        locationCoordinates:
          formData.locationLatitude && formData.locationLongitude
            ? { lat: formData.locationLatitude, lng: formData.locationLongitude }
            : null,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        maxParticipants: formData.maxParticipants,
        price: formData.price,
        isPrivate: formData.isPrivate,
        eventImage:
          formData.eventImage && formData.eventImage !== 'pending-upload'
            ? formData.eventImage
            : null,
      };

      sessionStorage.setItem('pendingEventData', JSON.stringify(eventData));
      setLocation('/create-event/invite');
      return;
    }

    // For public events or group events, create directly
    const startDateTime = new Date(`${formData.date}T${formData.time}`);
    const endDateTime = new Date(startDateTime.getTime() + parseInt(formData.duration) * 60000);

    const eventData = {
      title: formData.title,
      description: formData.description,
      sportType: formData.sportType,
      location: formData.location,
      locationCoordinates:
        formData.locationLatitude && formData.locationLongitude
          ? { lat: formData.locationLatitude, lng: formData.locationLongitude }
          : null,
      date: startDateTime.toISOString(),
      maxParticipants: parseInt(formData.maxParticipants) || 10,
      creatorId: user.id,
      isPublic: !formData.isPrivate,
      isFree: parseFloat(formData.price) === 0,
      cost: Math.round((parseFloat(formData.price) || 0) * 100),
      eventImage:
        formData.eventImage && formData.eventImage !== 'pending-upload'
          ? formData.eventImage
          : null,
    };

    createEventMutation.mutate(eventData);
  };

  const goBack = () => {
    setLocation('/myevents');
  };

  const handleInviteFriendsClose = () => {
    setInviteFriendsModalOpen(false);
    setCreatedEventId(null);
    setLocation('/myevents');
  };

  const renderCurrentStep = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case 'basics':
        return (
          <motion.div
            key="basics"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <FormField
              label="What's the name of your event?"
              icon={<CalendarIcon className="w-5 h-5" />}
              value={formData.title}
              onChange={(value) => updateFormData('title', value)}
              placeholder="e.g., Weekend Basketball Pickup Game"
              required
              maxLength={100}
              autoFocus
            />
            <FormField
              label="Tell people about your event (optional)"
              type="textarea"
              value={formData.description}
              onChange={(value) => updateFormData('description', value)}
              placeholder="Describe what to expect, what to bring, skill level, etc..."
              maxLength={500}
            />
          </motion.div>
        );

      case 'sport':
        return (
          <motion.div
            key="sport"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <Label className="text-lg font-semibold text-gray-900">
              What sport will you be playing?
            </Label>
            <SportSelector
              value={formData.sportType}
              onChange={(value) => updateFormData('sportType', value)}
            />
          </motion.div>
        );

      case 'datetime':
        return (
          <motion.div
            key="datetime"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Label className="text-lg font-semibold text-gray-900">When is your event?</Label>
            <DateTimePicker
              date={formData.date}
              time={formData.time}
              onDateChange={(value) => updateFormData('date', value)}
              onTimeChange={(value) => updateFormData('time', value)}
            />

            {/* Duration */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                How long will it last?
              </Label>
              <Select
                value={formData.duration}
                onValueChange={(value) => updateFormData('duration', value)}
              >
                <SelectTrigger className="text-lg p-4 h-14 rounded-2xl border-2 border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/20">
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
          </motion.div>
        );

      case 'location':
        return (
          <motion.div
            key="location"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Label className="text-lg font-semibold text-gray-900">
              Where will this take place?
            </Label>

            <LeafletMapWrapper>
              <LeafletLocationSearch
                placeholder="e.g., Central Park Basketball Court"
                value={formData.location}
                onLocationSelect={(location) => {
                  updateFormData('location', location.address);
                  updateFormData('locationLatitude', location.lat);
                  updateFormData('locationLongitude', location.lng);
                }}
                className="mb-4"
              />
            </LeafletMapWrapper>

            {/* Live preview map */}
            {formData.locationLatitude !== 0 && formData.locationLongitude !== 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <Label className="text-sm font-medium text-gray-600 mb-2 block">
                  📍 Location Preview
                </Label>
                <div className="rounded-2xl overflow-hidden border-2 border-gray-200">
                  <LeafletMapWrapper>
                    <LeafletEventMap
                      latitude={formData.locationLatitude}
                      longitude={formData.locationLongitude}
                      address={formData.location}
                      height="200px"
                      showMarker={true}
                    />
                  </LeafletMapWrapper>
                </div>
              </motion.div>
            )}
          </motion.div>
        );

      case 'details':
        return (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <FormField
              label="How many players do you need?"
              icon={<Users className="w-5 h-5" />}
              type="number"
              value={formData.maxParticipants}
              onChange={(value) => updateFormData('maxParticipants', value)}
              placeholder="e.g., 10"
              min={2}
              max={100}
              required
            />
            <FormField
              label="What's the cost per person?"
              icon={<DollarSign className="w-5 h-5" />}
              type="number"
              value={formData.price}
              onChange={(value) => updateFormData('price', value)}
              placeholder="0.00"
              min={0}
              step="0.01"
              hint="Enter 0 for free events"
            />
          </motion.div>
        );

      case 'image':
        return (
          <motion.div
            key="image"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Label className="text-lg font-semibold text-gray-900">
              Add an image to your event
            </Label>
            <p className="text-gray-600">Help people visualize your event with a great image</p>

            {imagePreview || formData.eventImage ? (
              <div className="relative">
                <img
                  src={imagePreview || formData.eventImage}
                  alt="Event preview"
                  className="w-full h-64 object-cover rounded-2xl border-2 border-gray-200"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm hover:bg-white"
                  onClick={() => {
                    setImagePreview('');
                    setUploadedImageFile(null);
                    setFormData((prev) => ({ ...prev, eventImage: '' }));
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-40 flex flex-col items-center justify-center space-y-3 border-2 border-dashed border-gray-300 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={() => document.getElementById('imageUpload')?.click()}
                  >
                    <Upload className="h-10 w-10 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-600">Upload Image</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-40 flex flex-col items-center justify-center space-y-3 border-2 border-dashed border-gray-300 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={() =>
                      generateImageMutation.mutate({
                        sportType: formData.sportType,
                        title: formData.title,
                      })
                    }
                    disabled={isGeneratingImage}
                  >
                    {isGeneratingImage ? (
                      <>
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                        <span className="text-sm font-semibold text-gray-600">Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-10 w-10 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-600">
                          Generate with AI
                        </span>
                      </>
                    )}
                  </motion.button>
                </div>

                <input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadedImageFile(file);
                      const objectUrl = URL.createObjectURL(file);
                      setImagePreview(objectUrl);
                      setFormData((prev) => ({ ...prev, eventImage: 'pending-upload' }));
                    }
                  }}
                />

                <p className="text-sm text-gray-500 text-center">
                  Skip this step if you prefer to add an image later
                </p>
              </div>
            )}
          </motion.div>
        );

      case 'visibility':
        return (
          <motion.div
            key="visibility"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Label className="text-lg font-semibold text-gray-900">
              Who can see and join your event?
            </Label>
            <div className="space-y-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 border-2 rounded-2xl cursor-pointer transition-all ${
                  !formData.isPrivate
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => updateFormData('isPrivate', false)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Globe className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">Public Event</h3>
                    <p className="text-gray-600 text-sm">Anyone can see and join this event</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 border-2 rounded-2xl cursor-pointer transition-all ${
                  formData.isPrivate
                    ? 'border-orange-500 bg-orange-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => updateFormData('isPrivate', true)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Lock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">Private Event</h3>
                    <p className="text-gray-600 text-sm">Only invited people can see and join</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <Button
            variant="ghost"
            className="p-2.5 hover:bg-white/80 rounded-xl"
            onClick={currentStep === 0 ? goBack : handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Create Event</h1>
          <div className="w-10" /> {/* Spacer */}
        </motion.div>

        {/* Step Indicator */}
        <StepIndicator steps={STEPS} currentStep={currentStep} completedSteps={completedSteps} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Form Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50 shadow-xl"
            >
              <AnimatePresence mode="wait">{renderCurrentStep()}</AnimatePresence>
            </motion.div>

            {/* Navigation Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6 flex gap-4"
            >
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="flex-1 h-14 text-base font-semibold rounded-2xl border-2 hover:bg-gray-50"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!isStepValid(currentStep) || createEventMutation.isPending}
                className="flex-1 h-14 text-base font-bold rounded-2xl bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all"
              >
                {createEventMutation.isPending ? (
                  'Creating...'
                ) : currentStep === STEPS.length - 1 ? (
                  formData.isPrivate && !groupId ? (
                    <>
                      <UserPlus className="h-5 w-5 mr-2" />
                      Choose Invitees
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Create Event
                    </>
                  )
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Live Preview Sidebar */}
          <div className="hidden lg:block">
            <EventPreviewCard
              title={formData.title}
              sportType={formData.sportType}
              location={formData.location}
              date={formData.date}
              time={formData.time}
              maxParticipants={formData.maxParticipants}
              price={formData.price}
              eventImage={imagePreview || formData.eventImage}
            />
          </div>
        </div>
      </div>

      {/* Success Confetti */}
      <SuccessConfetti show={showConfetti} />

      {/* Invite Friends Modal */}
      {inviteFriendsModalOpen && createdEventId && (
        <InviteFriendsModal eventId={createdEventId} onClose={handleInviteFriendsClose} />
      )}
    </div>
  );
};

export default CreateEvent;
