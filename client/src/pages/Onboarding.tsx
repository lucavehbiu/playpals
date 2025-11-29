import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { SportPreferenceSelector } from '@/components/onboarding/SportPreferenceSelector';
import { LocationSetup } from '@/components/onboarding/LocationSetup';
import { ProfilePhotoUpload } from '@/components/onboarding/ProfilePhotoUpload';
import { OnboardingComplete } from '@/components/onboarding/OnboardingComplete';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function Onboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Onboarding data
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [locationData, setLocationData] = useState({
    address: '',
    latitude: 0,
    longitude: 0,
  });
  const [profilePhoto, setProfilePhoto] = useState<{
    file: File | null;
    previewUrl: string;
  }>({
    file: null,
    previewUrl: '',
  });

  const totalSteps = 5;

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - save data and complete onboarding
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);

    try {
      // TODO: Save onboarding data to backend
      // - Update user with sportPreferences
      // - Update user with homeLocation and coordinates
      // - Upload profile photo if provided
      // - Set onboardingCompleted = true

      // For now, just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate to main app
      setTimeout(() => {
        setLocation('/discover');
      }, 3000); // Show completion screen for 3 seconds
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        // Welcome Step
        return (
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="flex justify-center mb-6"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-xl">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome{user?.name ? `, ${user.name}` : ''}!
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Let's personalize your experience so you can find the perfect events and connect with
              the right people.
            </p>
            <p className="text-sm text-gray-500">This will only take a minute ⏱️</p>
          </div>
        );

      case 2:
        // Sports Selection
        return (
          <SportPreferenceSelector selectedSports={selectedSports} onChange={setSelectedSports} />
        );

      case 3:
        // Location Setup
        return (
          <LocationSetup
            location={locationData.address}
            latitude={locationData.latitude}
            longitude={locationData.longitude}
            onLocationChange={(address, lat, lng) => {
              setLocationData({ address, latitude: lat, longitude: lng });
            }}
          />
        );

      case 4:
        // Profile Photo
        return (
          <ProfilePhotoUpload
            photoUrl={profilePhoto.previewUrl}
            onPhotoChange={(file, previewUrl) => {
              setProfilePhoto({ file, previewUrl });
            }}
          />
        );

      case 5:
        // Complete
        return (
          <OnboardingComplete
            userName={user?.name || ''}
            sportsCount={selectedSports.length}
            location={locationData.address}
          />
        );

      default:
        return null;
    }
  };

  const getNextLabel = () => {
    if (currentStep === 1) return "Let's Go!";
    if (currentStep === totalSteps) return 'Start Exploring';
    return 'Continue';
  };

  const isNextDisabled = () => {
    if (currentStep === 2) return selectedSports.length === 0;
    if (currentStep === 3) return locationData.address === '';
    return false;
  };

  const canSkip = () => {
    return currentStep === 4; // Can skip profile photo
  };

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={canSkip() ? handleSkip : undefined}
      nextLabel={getNextLabel()}
      nextDisabled={isNextDisabled()}
      showSkip={canSkip()}
      isLoading={isLoading}
    >
      {renderStep()}
    </OnboardingStep>
  );
}
