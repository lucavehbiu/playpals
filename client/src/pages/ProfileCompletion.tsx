// @ts-nocheck
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Check, User, Phone, Trophy, Star, Settings } from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ProfileBasicInfo } from '@/components/profile/ProfileBasicInfo';
import { PhoneVerification } from '@/components/profile/PhoneVerification';
import { SportSkillLevels } from '@/components/profile/SportSkillLevels';
import { ProfessionalTeamHistory } from '@/components/profile/ProfessionalTeamHistory';
import { calculateProfileCompletion } from '@/lib/profile-completion';

interface ProfileSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
  component: React.ComponentType<any>;
}

export default function ProfileCompletion() {
  const { user } = useAuth();

  const refetch = () => {
    // Refetch user data
    queryClient.invalidateQueries({ queryKey: ['/api/user'] });
  };
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Fetch data needed for profile completion calculation
  const { data: sportSkillLevels = [] } = useQuery({
    queryKey: [`/api/users/${user?.id}/sport-skill-levels`],
    enabled: !!user,
  });

  const { data: professionalTeamHistory = [] } = useQuery({
    queryKey: [`/api/users/${user?.id}/professional-team-history`],
    enabled: !!user,
  });

  const { data: onboardingPreferences = null } = useQuery({
    queryKey: [`/api/onboarding-preferences/${user?.id}`],
    enabled: !!user,
  });

  // Use unified profile completion calculation
  const profileCompletion = calculateProfileCompletion({
    user,
    sportSkillLevels,
    professionalTeamHistory,
    onboardingPreferences,
  });

  // Check for URL hash to auto-open specific section
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'sport-skills') {
      setActiveSection('sport-skills');
      // Scroll to section after a brief delay to ensure it's rendered
      setTimeout(() => {
        const element = document.getElementById('sport-skills');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  // Update backend profile completion level when it changes
  useEffect(() => {
    if (!user || !profileCompletion) return;

    if (user.profileCompletionLevel !== profileCompletion.completionPercentage) {
      updateProfileCompletion(profileCompletion.completionPercentage);
    }
  }, [user, profileCompletion]);

  const updateProfileCompletion = async (level: number) => {
    if (!user) return;

    try {
      await apiRequest('PUT', `/api/users/${user.id}/profile-completion`, {
        completionLevel: level,
      });
      refetch();
    } catch (error) {
      console.error('Error updating profile completion:', error);
    }
  };

  const profileSections: ProfileSection[] = [
    {
      id: 'basic-info',
      title: 'Complete Basic Info',
      description: 'Add your name, bio, and location to help others find you',
      icon: User,
      completed: profileCompletion.completedSections.includes('basic-info'),
      component: ProfileBasicInfo,
    },
    {
      id: 'phone-verification',
      title: 'Verify Phone Number',
      description: 'Add and verify your phone number for enhanced security',
      icon: Phone,
      completed: profileCompletion.completedSections.includes('phone-verification'),
      component: PhoneVerification,
    },
    {
      id: 'sport-skills',
      title: 'Add Sport Skill Levels',
      description: 'Share your experience level in different sports',
      icon: Star,
      completed: profileCompletion.completedSections.includes('sport-skills'),
      component: SportSkillLevels,
    },
    {
      id: 'team-history',
      title: 'Professional Team History',
      description: 'Add your professional, college, or youth team experience',
      icon: Trophy,
      completed: profileCompletion.completedSections.includes('team-history'),
      component: ProfessionalTeamHistory,
    },
    {
      id: 'onboarding-preferences',
      title: 'Sports Preferences',
      description: 'Complete your sports onboarding to help us match you better',
      icon: Settings,
      completed: profileCompletion.completedSections.includes('onboarding-preferences'),
      component: () => (
        <div className="p-4 text-center">
          <p className="mb-4">Complete your sports preferences and onboarding questions.</p>
          <Link to="/sports-preferences">
            <Button>Complete Sports Preferences</Button>
          </Link>
        </div>
      ),
    },
  ];

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
        <p className="text-gray-600 mb-4">
          Build trust and help others connect with you by completing your profile
        </p>

        <div className="bg-white rounded-lg p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Profile Strength</h2>
            <Badge
              variant={
                profileCompletion.completionPercentage >= 80
                  ? 'default'
                  : profileCompletion.completionPercentage >= 50
                    ? 'secondary'
                    : 'outline'
              }
            >
              {profileCompletion.completionPercentage >= 80
                ? 'Strong'
                : profileCompletion.completionPercentage >= 50
                  ? 'Good'
                  : 'Getting Started'}
            </Badge>
          </div>

          <Progress value={profileCompletion.completionPercentage} className="mb-2" />
          <p className="text-sm text-gray-600">
            {profileCompletion.completionPercentage}% complete
          </p>
        </div>
      </div>

      <div className="grid gap-6 mb-8">
        {profileSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Card
              key={section.id}
              id={section.id}
              className={`cursor-pointer transition-colors ${
                section.completed ? 'border-green-200 bg-green-50' : 'hover:border-gray-300'
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        section.completed
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {section.completed ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <IconComponent className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    {section.completed && (
                      <div className="text-sm text-green-600 font-medium">✓ Completed</div>
                    )}
                  </div>
                </div>
              </CardHeader>
              {activeSection !== section.id && (
                <CardContent>
                  <Button
                    onClick={() => setActiveSection(section.id)}
                    variant={section.completed ? 'outline' : 'default'}
                    className="w-full"
                  >
                    {section.completed ? 'Edit' : 'Complete'}
                  </Button>
                </CardContent>
              )}
              {activeSection === section.id && (
                <CardContent>
                  <section.component
                    onComplete={() => {
                      setActiveSection(null);
                      refetch();
                      checkCompletionStatus();
                    }}
                    onCancel={() => setActiveSection(null)}
                  />
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <Link href="/profile">
          <Button variant="outline" className="mr-4">
            View Profile
          </Button>
        </Link>
        <Link href="/">
          <Button>Continue to App</Button>
        </Link>
      </div>
    </div>
  );
}
