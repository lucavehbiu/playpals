import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Check, User, Phone, Trophy, Star } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ProfileBasicInfo } from "@/components/profile/ProfileBasicInfo";
import { PhoneVerification } from "@/components/profile/PhoneVerification";
import { SportSkillLevels } from "@/components/profile/SportSkillLevels";
import { ProfessionalTeamHistory } from "@/components/profile/ProfessionalTeamHistory";

interface ProfileSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
  points: number;
  component: React.ComponentType<any>;
}

export default function ProfileCompletion() {
  const { user } = useAuth();
  
  const refetch = () => {
    // Refetch user data
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
  };
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [completionLevel, setCompletionLevel] = useState(0);

  // Calculate profile completion based on user data
  useEffect(() => {
    if (!user) return;

    let points = 0;
    const maxPoints = 100;

    // Basic info (30 points)
    if (user.name && user.bio && user.location) points += 30;
    
    // Phone verification (20 points)
    if (user.phoneNumber && user.isPhoneVerified) points += 20;

    // Sport preferences (25 points)
    // This would need to check user sport preferences
    
    // Professional team history (25 points)
    // This would need to check professional team history

    const percentage = Math.round((points / maxPoints) * 100);
    setCompletionLevel(percentage);

    // Update backend if changed
    if (user.profileCompletionLevel !== percentage) {
      updateProfileCompletion(percentage);
    }
  }, [user]);

  const updateProfileCompletion = async (level: number) => {
    if (!user) return;
    
    try {
      await apiRequest(`/api/users/${user.id}/profile-completion`, {
        method: 'PUT',
        body: { completionLevel: level }
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
      completed: !!(user?.name && user?.bio && user?.location),
      points: 30,
      component: ProfileBasicInfo
    },
    {
      id: 'phone-verification',
      title: 'Verify Phone Number',
      description: 'Add and verify your phone number for enhanced security',
      icon: Phone,
      completed: !!(user?.phoneNumber && user?.isPhoneVerified),
      points: 20,
      component: PhoneVerification
    },
    {
      id: 'sport-skills',
      title: 'Add Sport Skill Levels',
      description: 'Share your experience level in different sports',
      icon: Star,
      completed: false, // Will be calculated from sport skill levels
      points: 25,
      component: SportSkillLevels
    },
    {
      id: 'team-history',
      title: 'Professional Team History',
      description: 'Add your professional, college, or youth team experience',
      icon: Trophy,
      completed: false, // Will be calculated from team history
      points: 25,
      component: ProfessionalTeamHistory
    }
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
            <Badge variant={completionLevel >= 80 ? "default" : completionLevel >= 50 ? "secondary" : "outline"}>
              {completionLevel >= 80 ? "Strong" : completionLevel >= 50 ? "Good" : "Getting Started"}
            </Badge>
          </div>
          
          <Progress value={completionLevel} className="mb-2" />
          <p className="text-sm text-gray-600">{completionLevel}% complete</p>
        </div>
      </div>

      <div className="grid gap-6 mb-8">
        {profileSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Card key={section.id} className={`cursor-pointer transition-colors ${
              section.completed ? 'border-green-200 bg-green-50' : 'hover:border-gray-300'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      section.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {section.completed ? <Check className="h-5 w-5" /> : <IconComponent className="h-5 w-5" />}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{section.points} points</div>
                    {section.completed && <div className="text-xs text-green-600">✓ Completed</div>}
                  </div>
                </div>
              </CardHeader>
              {activeSection !== section.id && (
                <CardContent>
                  <Button 
                    onClick={() => setActiveSection(section.id)}
                    variant={section.completed ? "outline" : "default"}
                    className="w-full"
                  >
                    {section.completed ? "Edit" : "Complete"}
                  </Button>
                </CardContent>
              )}
              {activeSection === section.id && (
                <CardContent>
                  <section.component 
                    onComplete={() => {
                      setActiveSection(null);
                      refetch();
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
          <Button>
            Continue to App
          </Button>
        </Link>
      </div>
    </div>
  );
}