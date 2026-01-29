import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Trophy } from 'lucide-react';
import { sportTypes } from '@shared/schema';

const teamHistorySchema = z.object({
  teamName: z.string().min(1, 'Team name is required'),
  sportType: z.string().min(1, 'Sport type is required'),
  teamType: z.enum(['professional', 'youth', 'college', 'amateur']),
  position: z.string().optional(),
  yearFrom: z.number().min(1950).max(new Date().getFullYear()),
  yearTo: z.number().min(1950).max(new Date().getFullYear()).optional(),
  isCurrentTeam: z.boolean().default(false),
  achievements: z.string().optional(),
  isVisible: z.boolean().default(true),
});

interface ProfessionalTeamHistory {
  id: number;
  teamName: string;
  sportType: string;
  teamType: string;
  position?: string;
  yearFrom: number;
  yearTo?: number;
  isCurrentTeam: boolean;
  achievements?: string;
  isVisible: boolean;
}

interface ProfessionalTeamHistoryProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function ProfessionalTeamHistory({ onComplete, onCancel }: ProfessionalTeamHistoryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teamHistory, setTeamHistory] = useState<ProfessionalTeamHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasNoProfessionalExperience, setHasNoProfessionalExperience] = useState(false);

  const form = useForm<z.infer<typeof teamHistorySchema>>({
    resolver: zodResolver(teamHistorySchema),
    defaultValues: {
      teamName: '',
      sportType: '',
      teamType: 'amateur',
      position: '',
      yearFrom: new Date().getFullYear(),
      yearTo: undefined,
      isCurrentTeam: false,
      achievements: '',
      isVisible: true,
    },
  });

  useEffect(() => {
    fetchTeamHistory();
  }, [user]);

  const fetchTeamHistory = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/users/${user.id}/professional-team-history`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTeamHistory(data);
        // Check if user has explicitly set "no professional experience"
        if (data.length === 0) {
          // Could add a user preference here to remember "no professional experience" selection
        }
      }
    } catch (error) {
      console.error('Error fetching team history:', error);
    }
  };

  const onSubmit = async (values: z.infer<typeof teamHistorySchema>) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // If current team, don't include yearTo
      const submitData = values.isCurrentTeam ? { ...values, yearTo: undefined } : values;

      await apiRequest('POST', `/api/users/${user.id}/professional-team-history`, submitData);

      toast({
        title: 'Team history added',
        description: `Added ${values.teamName} to your profile.`,
      });

      form.reset();
      setIsEditing(false);
      fetchTeamHistory();
    } catch (error: any) {
      toast({
        title: 'Error adding team history',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTeamHistory = async (id: number) => {
    try {
      await apiRequest('DELETE', `/api/professional-team-history/${id}`);

      toast({
        title: 'Team history removed',
        description: 'The team history has been removed from your profile.',
      });

      fetchTeamHistory();
    } catch (error) {
      toast({
        title: 'Error removing team history',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const getTeamTypeBadge = (type: string) => {
    switch (type) {
      case 'professional':
        return 'bg-yellow-100 text-yellow-800';
      case 'college':
        return 'bg-blue-100 text-blue-800';
      case 'youth':
        return 'bg-green-100 text-green-800';
      case 'amateur':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isCurrentTeam = form.watch('isCurrentTeam');

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Professional Team History</h3>

      <div className="text-sm text-gray-600">
        Add your experience with professional, college, youth, or amateur teams to showcase your
        athletic background.
      </div>

      {/* No Professional Experience Option */}
      <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
        <Checkbox
          id="noProfessionalExperience"
          checked={hasNoProfessionalExperience}
          onCheckedChange={(checked) => setHasNoProfessionalExperience(!!checked)}
        />
        <label htmlFor="noProfessionalExperience" className="text-sm font-medium">
          I have no professional team experience
        </label>
      </div>

      {/* Existing Team History */}
      {!hasNoProfessionalExperience && teamHistory.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Your Team History</h4>
          {teamHistory.map((team) => (
            <Card key={team.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <Trophy className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h5 className="font-medium">{team.teamName}</h5>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <Badge className={getTeamTypeBadge(team.teamType)}>{team.teamType}</Badge>
                      <span>•</span>
                      <span className="capitalize">{team.sportType}</span>
                      {team.position && (
                        <>
                          <span>•</span>
                          <span>{team.position}</span>
                        </>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {team.yearFrom} - {team.isCurrentTeam ? 'Present' : team.yearTo}
                    </div>
                    {team.achievements && (
                      <div className="text-sm text-gray-700 mt-1">{team.achievements}</div>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteTeamHistory(team.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Team History */}
      {!hasNoProfessionalExperience &&
        (!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Team History
          </Button>
        ) : (
          <Card className="p-4">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-base">Add Team History</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="teamName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Lakers, Manchester United" {...field} />
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
                        <FormLabel>Sport</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a sport" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sportTypes.map((sport) => (
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

                  <FormField
                    control={form.control}
                    name="teamType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="college">College</SelectItem>
                            <SelectItem value="youth">Youth</SelectItem>
                            <SelectItem value="amateur">Amateur</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Point Guard, Midfielder" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isCurrentTeam"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>I currently play for this team</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="yearFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Year</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1950"
                            max={new Date().getFullYear()}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || new Date().getFullYear())
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!isCurrentTeam && (
                    <FormField
                      control={form.control}
                      name="yearTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Year</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1950"
                              max={new Date().getFullYear()}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || undefined)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="achievements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Achievements (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., Championship winner, MVP, All-Star selection..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-4">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Adding...' : 'Add Team History'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        ))}

      <div className="flex space-x-4 pt-4">
        <Button
          onClick={async () => {
            if (hasNoProfessionalExperience && user) {
              // Save the "no professional experience" preference to user profile
              try {
                await apiRequest('PUT', `/api/users/${user.id}`, {
                  hasNoProfessionalExperience: true,
                });
                toast({
                  title: 'Preference saved',
                  description: 'Your professional experience preference has been saved.',
                });
              } catch (error) {
                console.error('Error saving preference:', error);
              }
            }
            onComplete();
          }}
        >
          {teamHistory.length > 0 || hasNoProfessionalExperience
            ? 'Complete Profile'
            : 'Skip for Now'}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Back
        </Button>
      </div>
    </div>
  );
}
