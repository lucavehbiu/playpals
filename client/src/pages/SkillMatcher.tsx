// @ts-nocheck
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Trophy, Target, Star, MapPin, Clock, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SkillMatcherPreference, SkillMatch } from '@shared/schema';

const sportTypes = [
  'basketball',
  'soccer',
  'tennis',
  'volleyball',
  'badminton',
  'baseball',
  'football',
  'hockey',
  'golf',
  'swimming',
  'running',
  'cycling',
  'boxing',
  'wrestling',
  'martial_arts',
  'yoga',
  'pilates',
  'crossfit',
  'rock_climbing',
  'hiking',
  'skiing',
  'snowboarding',
  'surfing',
  'padel',
];

const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
const skillMatchModes = ['exact', 'similar', 'range', 'any'];

export default function SkillMatcher() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSport, setSelectedSport] = useState<string>('basketball');
  const [activeTab, setActiveTab] = useState('preferences');

  // Fetch user's skill matcher preferences
  const { data: preferences = [], isLoading: preferencesLoading } = useQuery({
    queryKey: ['/api/skill-matcher/preferences'],
    enabled: !!user,
  });

  // Fetch skill matches
  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ['/api/skill-matcher/matches'],
    enabled: !!user,
  });

  // Get current sport preference
  const currentPreference = preferences.find(
    (pref: SkillMatcherPreference) => pref.sportType === selectedSport
  );

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/skill-matcher/preferences', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skill-matcher/preferences'] });
      toast({
        title: 'Preferences Saved',
        description: 'Your skill matcher preferences have been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save preferences',
        variant: 'destructive',
      });
    },
  });

  // Generate matches mutation
  const generateMatchesMutation = useMutation({
    mutationFn: async (sportType: string) => {
      return apiRequest('/api/skill-matcher/generate', {
        method: 'POST',
        body: JSON.stringify({ sportType }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skill-matcher/matches'] });
      toast({
        title: 'Matches Generated',
        description: 'New skill matches have been found for you!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate matches',
        variant: 'destructive',
      });
    },
  });

  const handleSavePreferences = (formData: any) => {
    const preferenceData = {
      sportType: selectedSport,
      skillMatchMode: formData.skillMatchMode,
      preferredSkillLevels: formData.preferredSkillLevels || [],
      maxDistance: formData.maxDistance || 50,
      distancePreference: formData.distancePreference || 'city',
      isActive: true,
    };

    savePreferencesMutation.mutate(preferenceData);
  };

  const handleGenerateMatches = () => {
    generateMatchesMutation.mutate(selectedSport);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Please log in to use the Skill Matcher</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Interactive Skill Matcher
          </h1>
          <p className="text-lg text-muted-foreground">
            Find compatible sports partners based on your skill level and preferences
          </p>
        </div>

        {/* Sport Selection */}
        <div className="mb-6">
          <Label htmlFor="sport-select" className="text-base font-semibold mb-2 block">
            Select Sport
          </Label>
          <Select value={selectedSport} onValueChange={setSelectedSport}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder="Choose a sport" />
            </SelectTrigger>
            <SelectContent>
              {sportTypes.map((sport) => (
                <SelectItem key={sport} value={sport}>
                  {sport.charAt(0).toUpperCase() + sport.slice(1).replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Matches
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preferences" className="mt-6">
            <PreferencesTab
              selectedSport={selectedSport}
              currentPreference={currentPreference}
              onSave={handleSavePreferences}
              isLoading={savePreferencesMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="matches" className="mt-6">
            <MatchesTab
              selectedSport={selectedSport}
              matches={matches}
              isLoading={matchesLoading}
              onGenerateMatches={handleGenerateMatches}
              isGenerating={generateMatchesMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <InsightsTab matches={matches} preferences={preferences} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

// Preferences Tab Component
function PreferencesTab({
  selectedSport,
  currentPreference,
  onSave,
  isLoading,
}: {
  selectedSport: string;
  currentPreference?: SkillMatcherPreference;
  onSave: (data: any) => void;
  isLoading: boolean;
}) {
  const [skillMatchMode, setSkillMatchMode] = useState(
    currentPreference?.skillMatchMode || 'similar'
  );
  const [preferredSkillLevels, setPreferredSkillLevels] = useState<string[]>(
    currentPreference?.preferredSkillLevels || []
  );
  const [maxDistance, setMaxDistance] = useState(currentPreference?.maxDistance || 50);
  const [distancePreference, setDistancePreference] = useState(
    currentPreference?.distancePreference || 'city'
  );

  const handleSkillLevelChange = (level: string, checked: boolean) => {
    if (checked) {
      setPreferredSkillLevels([...preferredSkillLevels, level]);
    } else {
      setPreferredSkillLevels(preferredSkillLevels.filter((l) => l !== level));
    }
  };

  const handleSave = () => {
    onSave({
      skillMatchMode,
      preferredSkillLevels,
      maxDistance,
      distancePreference,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Matching Preferences for {selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1)}
        </CardTitle>
        <CardDescription>Configure how you want to find compatible sports partners</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Skill Match Mode */}
        <div>
          <Label className="text-base font-semibold mb-3 block">Skill Matching Mode</Label>
          <div className="grid grid-cols-2 gap-3">
            {skillMatchModes.map((mode) => (
              <div
                key={mode}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  skillMatchMode === mode
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'hover:bg-muted'
                }`}
                onClick={() => setSkillMatchMode(mode)}
              >
                <div className="font-medium capitalize">{mode.replace('_', ' ')}</div>
                <div className="text-sm opacity-80">
                  {mode === 'exact' && 'Only match players with exactly the same skill level'}
                  {mode === 'similar' && 'Match players within 1 skill level difference'}
                  {mode === 'range' && 'Match players within your selected skill range'}
                  {mode === 'any' && 'Open to players of all skill levels'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preferred Skill Levels (only for range mode) */}
        {skillMatchMode === 'range' && (
          <div>
            <Label className="text-base font-semibold mb-3 block">Preferred Skill Levels</Label>
            <div className="grid grid-cols-2 gap-3">
              {skillLevels.map((level) => (
                <div key={level} className="flex items-center space-x-2">
                  <Checkbox
                    id={level}
                    checked={preferredSkillLevels.includes(level)}
                    onCheckedChange={(checked) => handleSkillLevelChange(level, checked as boolean)}
                  />
                  <Label htmlFor={level} className="capitalize">
                    {level}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Distance Preferences */}
        <div>
          <Label className="text-base font-semibold mb-3 block">Distance Preference</Label>
          <Select value={distancePreference} onValueChange={setDistancePreference}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nearby">Nearby (within 10km)</SelectItem>
              <SelectItem value="city">Same City (within 25km)</SelectItem>
              <SelectItem value="region">Same Region (within 50km)</SelectItem>
              <SelectItem value="anywhere">Anywhere</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSave} disabled={isLoading} className="w-full" size="lg">
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
}

// Matches Tab Component
function MatchesTab({
  selectedSport,
  matches,
  isLoading,
  onGenerateMatches,
  isGenerating,
}: {
  selectedSport: string;
  matches: any[];
  isLoading: boolean;
  onGenerateMatches: () => void;
  isGenerating: boolean;
}) {
  const sportMatches = matches.filter((match: any) => match.sportType === selectedSport);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">
            {selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1)} Matches
          </h3>
          <p className="text-muted-foreground">{sportMatches.length} compatible players found</p>
        </div>
        <Button
          onClick={onGenerateMatches}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
          <Target className="w-4 h-4" />
          Find New Matches
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : sportMatches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No matches found yet</h3>
            <p className="text-muted-foreground mb-4">
              Set your preferences and generate matches to find compatible players
            </p>
            <Button onClick={onGenerateMatches} disabled={isGenerating}>
              {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Generate Matches
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence>
            {sportMatches.map((match: any, index: number) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <MatchCard match={match} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// Match Card Component
function MatchCard({ match }: { match: any }) {
  const compatibilityColor =
    match.compatibilityScore >= 90
      ? 'text-green-600'
      : match.compatibilityScore >= 70
        ? 'text-blue-600'
        : match.compatibilityScore >= 50
          ? 'text-orange-600'
          : 'text-red-600';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={match.matchedUser?.profileImage} />
            <AvatarFallback>
              {match.matchedUser?.name?.charAt(0) || match.matchedUser?.username?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">
                {match.matchedUser?.name || match.matchedUser?.username}
              </h4>
              <Badge className={compatibilityColor}>{match.compatibilityScore}% Match</Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="w-4 h-4" />
                Skill Level: {match.matchedUser?.skillLevel || 'Not specified'}
              </div>

              {match.matchedUser?.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {match.matchedUser.location}
                </div>
              )}

              <div className="text-sm text-muted-foreground">{match.matchReason}</div>
            </div>

            <Progress value={match.compatibilityScore} className="mt-3" />

            <div className="flex gap-2 mt-4">
              <Button size="sm" className="flex-1">
                View Profile
              </Button>
              <Button size="sm" variant="outline" className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                Connect
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Insights Tab Component
function InsightsTab({ matches, preferences }: { matches: any[]; preferences: any[] }) {
  const totalMatches = matches.length;
  const avgCompatibility =
    matches.length > 0
      ? Math.round(
          matches.reduce((sum: number, match: any) => sum + match.compatibilityScore, 0) /
            matches.length
        )
      : 0;

  const sportBreakdown = matches.reduce((acc: any, match: any) => {
    acc[match.sportType] = (acc[match.sportType] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Match Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>Total Matches:</span>
            <span className="font-semibold">{totalMatches}</span>
          </div>
          <div className="flex justify-between">
            <span>Average Compatibility:</span>
            <span className="font-semibold">{avgCompatibility}%</span>
          </div>
          <div className="flex justify-between">
            <span>Active Sports:</span>
            <span className="font-semibold">{preferences.length}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sport Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(sportBreakdown).map(([sport, count]) => (
              <div key={sport} className="flex justify-between items-center">
                <span className="capitalize">{sport.replace('_', ' ')}</span>
                <Badge variant="secondary">{count} matches</Badge>
              </div>
            ))}
          </div>
          {Object.keys(sportBreakdown).length === 0 && (
            <p className="text-muted-foreground text-center py-4">No matches generated yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
