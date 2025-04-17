import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { sportTypes, activityFrequencies, teamSizePreferences, teamStatusOptions } from '@shared/schema';
import { motion, AnimatePresence } from 'framer-motion';

// Define our onboarding slide interfaces
interface OnboardingSlide {
  id: string;
  title: string;
  component: React.ReactNode;
}

const SportsPreferencesPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // Sports preferences state
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [playFrequency, setPlayFrequency] = useState<string>('');
  const [teamSizePreference, setTeamSizePreference] = useState<string>('');
  const [teamStatus, setTeamStatus] = useState<string>('');
  const [additionalInfo, setAdditionalInfo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Calculate progress based on the current slide
    const newProgress = ((currentSlideIndex + 1) / slides.length) * 100;
    setProgress(newProgress);
  }, [currentSlideIndex]);

  const handleSportSelection = (sport: string) => {
    setSelectedSports(prev => {
      if (prev.includes(sport)) {
        return prev.filter(s => s !== sport);
      } else {
        return [...prev, sport];
      }
    });
  };

  const handleNext = () => {
    // Validate the current slide
    if (currentSlideIndex === 0 && selectedSports.length === 0) {
      toast({
        title: "Please select at least one sport",
        description: "You need to select at least one sport to continue.",
        variant: "destructive"
      });
      return;
    }

    if (currentSlideIndex === 1 && !playFrequency) {
      toast({
        title: "Please select how often you play",
        description: "You need to select a play frequency to continue.",
        variant: "destructive"
      });
      return;
    }

    if (currentSlideIndex === 2 && !teamSizePreference) {
      toast({
        title: "Please select a team size preference",
        description: "You need to select a team size preference to continue.",
        variant: "destructive"
      });
      return;
    }

    if (currentSlideIndex === 3 && !teamStatus) {
      toast({
        title: "Please select your team status",
        description: "You need to select your current team status to continue.",
        variant: "destructive"
      });
      return;
    }

    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to save your preferences.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create onboarding preferences object
      const preferenceData = {
        userId: user.id,
        preferredSports: selectedSports,
        playFrequency,
        teamSizePreference,
        teamStatus,
        additionalInfo: additionalInfo || null
      };

      // Submit to API
      await apiRequest(
        'POST',
        '/api/onboarding-preferences',
        preferenceData
      );

      // Mark as completed
      await apiRequest(
        'POST',
        `/api/onboarding-preferences/${user.id}/complete`
      );

      toast({
        title: "Profile completed!",
        description: "Your sports preferences have been saved.",
        variant: "default"
      });

      // Navigate to the home page
      setLocation('/');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Something went wrong",
        description: "We couldn't save your preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define all the slides
  const slides: OnboardingSlide[] = [
    {
      id: 'sports',
      title: 'Which sports do you play?',
      component: (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          {sportTypes.map(sport => (
            <Button
              key={sport}
              variant={selectedSports.includes(sport) ? "default" : "outline"}
              className={`flex flex-col h-20 items-center justify-center text-sm ${
                selectedSports.includes(sport) ? 'bg-primary text-primary-foreground' : ''
              }`}
              onClick={() => handleSportSelection(sport)}
            >
              {selectedSports.includes(sport) && (
                <CheckCircle className="w-5 h-5 absolute top-2 right-2" />
              )}
              <span className="capitalize">{sport}</span>
            </Button>
          ))}
        </div>
      )
    },
    {
      id: 'frequency',
      title: 'How often do you play sports?',
      component: (
        <div className="flex flex-col gap-3 mt-4">
          {activityFrequencies.map(frequency => (
            <Button
              key={frequency}
              variant={playFrequency === frequency ? "default" : "outline"}
              className="justify-start text-left h-14"
              onClick={() => setPlayFrequency(frequency)}
            >
              <span className="capitalize">
                {frequency === 'rarely' && 'Rarely (a few times a year)'}
                {frequency === 'occasionally' && 'Occasionally (once a month)'}
                {frequency === 'regularly' && 'Regularly (a few times a month)'}
                {frequency === 'frequently' && 'Frequently (multiple times a week)'}
              </span>
            </Button>
          ))}
        </div>
      )
    },
    {
      id: 'teamSize',
      title: 'What size team do you prefer?',
      component: (
        <div className="flex flex-col gap-3 mt-4">
          {teamSizePreferences.map(size => (
            <Button
              key={size}
              variant={teamSizePreference === size ? "default" : "outline"}
              className="justify-start text-left h-14"
              onClick={() => setTeamSizePreference(size)}
            >
              <span className="capitalize">
                {size === 'small' && 'Small teams (2-5 people)'}
                {size === 'medium' && 'Medium teams (6-10 people)'}
                {size === 'large' && 'Large teams (10+ people)'}
                {size === 'any' && 'No preference'}
              </span>
            </Button>
          ))}
        </div>
      )
    },
    {
      id: 'teamStatus',
      title: 'Do you already have a team?',
      component: (
        <div className="flex flex-col gap-3 mt-4">
          {teamStatusOptions.map(status => (
            <Button
              key={status}
              variant={teamStatus === status ? "default" : "outline"}
              className="justify-start text-left h-14"
              onClick={() => setTeamStatus(status)}
            >
              <span className="capitalize">
                {status === 'solo' && 'No, I play solo'}
                {status === 'has_team' && 'Yes, I already have a team'}
                {status === 'looking_for_team' && "No, but I'm looking to join a team"}
              </span>
            </Button>
          ))}
        </div>
      )
    },
    {
      id: 'additionalInfo',
      title: "Anything else you'd like to share?",
      component: (
        <div className="flex flex-col gap-3 mt-4">
          <textarea
            placeholder="Tell us about your sports experience, what you're looking for, or any other details that might help us match you with the right events and teams."
            className="w-full h-32 p-3 border rounded-md"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
          />
        </div>
      )
    }
  ];

  const currentSlide = slides[currentSlideIndex];
  const isLastSlide = currentSlideIndex === slides.length - 1;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="px-3 py-1">
                Step {currentSlideIndex + 1} of {slides.length}
              </Badge>
            </div>
            <Progress value={progress} className="h-2 mb-4" />
            <CardTitle className="text-xl font-semibold">
              {currentSlide.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {currentSlide.component}
              </motion.div>
            </AnimatePresence>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentSlideIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Saving..."
              ) : isLastSlide ? (
                "Complete Profile"
              ) : (
                <>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SportsPreferencesPage;