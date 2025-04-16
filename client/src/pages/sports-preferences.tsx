import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, Medal, Info, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define the sport types from schema
const sportTypes = [
  "basketball",
  "soccer",
  "tennis",
  "volleyball",
  "cycling",
  "yoga",
  "running",
  "swimming",
  "football",
  "baseball",
  "hiking",
  "golf",
  "other",
] as const;

// Define skill levels and their descriptions as per the user's requirements
const skillLevelDescriptions = {
  beginner: {
    title: "Beginner",
    frequency: "Plays less than once a week",
    experience: "Has been playing for less than 6 months",
    skills: "Still learning the basic rules and techniques",
    competition: "No experience in competitive or organized matches"
  },
  intermediate: {
    title: "Intermediate",
    frequency: "Plays 1–2 times per week",
    experience: "Has 6 months to 2 years of experience",
    skills: "Understands the rules and has decent control and movement",
    competition: "Has played informal games or local matches"
  },
  advanced: {
    title: "Advanced",
    frequency: "Plays 2–4 times per week",
    experience: "2+ years of consistent experience",
    skills: "Strong technical and tactical understanding",
    competition: "Plays regularly in amateur tournaments or structured games"
  },
  expert: {
    title: "Expert / Competitive",
    frequency: "Plays more than 4 times per week",
    experience: "Over 3 years of serious practice",
    skills: "Excellent technique and stamina",
    competition: "Competes in semi-professional or high-level competitive events"
  }
};

// Define the types for our form data
type SportPreference = {
  sportType: string;
  skillLevel: string;
  yearsExperience: number;
};

export default function SportPreferencesPage() {
  const [, setLocation] = useLocation();
  const navigate = (to: string) => setLocation(to);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for tracking selected sports and their skill levels
  const [selectedSport, setSelectedSport] = useState<string>(sportTypes[0]);
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<string>("beginner");
  const [selectedYears, setSelectedYears] = useState<number>(0);
  const [savedPreferences, setSavedPreferences] = useState<SportPreference[]>([]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    console.log("Sports preferences page - user:", user);
    if (!user) {
      console.log("No user found, redirecting to auth page");
      navigate("/auth");
    } else {
      console.log("User authenticated, staying on sports preferences page");
    }
  }, [user, navigate]);

  // Mutation for saving sport preferences
  const savePreferenceMutation = useMutation({
    mutationFn: async (data: { userId: number; sportType: string; skillLevel: string; yearsExperience: number }) => {
      const res = await apiRequest("POST", "/api/sport-preferences", data);
      return res.json();
    },
    onSuccess: (data) => {
      // Add the new preference to our local state
      setSavedPreferences(prev => [...prev, {
        sportType: data.sportType,
        skillLevel: data.skillLevel,
        yearsExperience: data.yearsExperience
      }]);
      
      // Show success toast
      toast({
        title: "Preference saved!",
        description: `Your ${data.sportType} preference has been saved.`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/sport-preferences/user/${user?.id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving preference",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Complete profile and proceed to home
  const completeProfileMutation = useMutation({
    mutationFn: async () => {
      // You could save a "profile complete" flag here if needed
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Profile setup complete!",
        description: "Welcome to PlayPals - you're all set to start playing!",
      });
      navigate("/");
    }
  });

  const handleAddSport = () => {
    if (!user) return;
    
    // Check if we already have this sport in our preferences
    if (savedPreferences.some(pref => pref.sportType === selectedSport)) {
      toast({
        title: "Sport already added",
        description: "You've already added this sport. Please select a different one.",
        variant: "destructive",
      });
      return;
    }
    
    savePreferenceMutation.mutate({
      userId: user.id,
      sportType: selectedSport,
      skillLevel: selectedSkillLevel,
      yearsExperience: selectedYears
    });
  };
  
  const handleContinue = () => {
    if (savedPreferences.length === 0) {
      toast({
        title: "Add at least one sport",
        description: "Please add at least one sport preference before continuing.",
        variant: "destructive",
      });
      return;
    }
    
    completeProfileMutation.mutate();
  };
  
  // Variants for animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4 }
    },
  };
  
  // Skip to the main page if already logged in and preferences set
  if (!user) {
    return null; // Redirect will happen in useEffect
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Set Your Sports Preferences</h1>
          <p className="text-gray-600">
            Tell us about the sports you enjoy and your skill level
          </p>
        </motion.div>
        
        <motion.div
          className="grid gap-8 md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Sport Selection Card */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Card className="shadow-md border-none">
              <CardHeader>
                <CardTitle>Add Your Sports</CardTitle>
                <CardDescription>Select sports you play and your skill level</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="sport-select">Select Sport</Label>
                  <Select value={selectedSport} onValueChange={setSelectedSport}>
                    <SelectTrigger id="sport-select" className="w-full">
                      <SelectValue placeholder="Select a sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {sportTypes.map((sport) => (
                        <SelectItem key={sport} value={sport}>
                          {sport.charAt(0).toUpperCase() + sport.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="skill-level">Skill Level</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="max-w-xs text-sm">
                            Select based on your experience, frequency of play, and ability
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <RadioGroup 
                    value={selectedSkillLevel}
                    onValueChange={setSelectedSkillLevel}
                    className="grid gap-4 grid-cols-1 sm:grid-cols-2"
                  >
                    {Object.entries(skillLevelDescriptions).map(([level, desc]) => (
                      <div key={level} className="relative">
                        <RadioGroupItem
                          value={level}
                          id={`skill-${level}`}
                          className="peer absolute opacity-0"
                        />
                        <Label
                          htmlFor={`skill-${level}`}
                          className="flex flex-col h-full p-4 border rounded-lg cursor-pointer hover:bg-slate-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                        >
                          <span className="font-medium mb-1">{desc.title}</span>
                          <span className="text-xs text-gray-500 block mb-1">{desc.frequency}</span>
                          <span className="text-xs text-gray-500 block">{desc.experience}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="years-experience">Years of Experience</Label>
                  <Select 
                    value={selectedYears.toString()} 
                    onValueChange={(val) => setSelectedYears(parseInt(val))}
                  >
                    <SelectTrigger id="years-experience">
                      <SelectValue placeholder="Select years" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(20)].map((_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i === 0 ? "Less than 1 year" : `${i} year${i > 1 ? "s" : ""}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => navigate("/auth")}
                  className="gap-1"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={handleAddSport}
                  disabled={savePreferenceMutation.isPending}
                  className="gap-1"
                >
                  {savePreferenceMutation.isPending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    <>Add Sport</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
          
          {/* Selected Sports Card */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-md border-none h-full">
              <CardHeader>
                <CardTitle>Your Sports</CardTitle>
                <CardDescription>
                  {savedPreferences.length 
                    ? `${savedPreferences.length} sport${savedPreferences.length !== 1 ? 's' : ''} added` 
                    : 'No sports added yet'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savedPreferences.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Medal className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Add sports you play to personalize your experience</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedPreferences.map((pref, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-slate-50">
                        <div className="flex justify-between items-center">
                          <span className="font-medium capitalize">
                            {pref.sportType}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                            {skillLevelDescriptions[pref.skillLevel as keyof typeof skillLevelDescriptions]?.title}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {pref.yearsExperience === 0 
                            ? "Less than 1 year experience" 
                            : `${pref.yearsExperience} year${pref.yearsExperience !== 1 ? 's' : ''} experience`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full gap-1"
                  onClick={handleContinue}
                  disabled={savedPreferences.length === 0 || completeProfileMutation.isPending}
                >
                  {completeProfileMutation.isPending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
        
        <motion.div
          variants={itemVariants}
          className="mt-8"
        >
          <Card className="shadow-md border-none bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Skill Level Descriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(skillLevelDescriptions).map(([level, desc], index) => (
                  <div key={level}>
                    <h3 className="font-bold text-gray-800">{desc.title}</h3>
                    <ul className="mt-1 space-y-1 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{desc.frequency}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{desc.experience}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{desc.skills}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{desc.competition}</span>
                      </li>
                    </ul>
                    {index < Object.entries(skillLevelDescriptions).length - 1 && (
                      <Separator className="my-3" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}