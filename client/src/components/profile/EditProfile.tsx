import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, MapPin, FileText, Shield, Save, X, Eye, EyeOff } from "lucide-react";

const editProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().optional(),
  bio: z.string().optional(),
  headline: z.string().optional(),
  location: z.string().optional(),
  // Privacy settings
  showEmail: z.boolean().default(false),
  showPhone: z.boolean().default(false),
  showLocation: z.boolean().default(true),
});

interface EditProfileProps {
  onClose: () => void;
  onSave: () => void;
}

export function EditProfile({ onClose, onSave }: EditProfileProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'privacy'>('basic');

  const form = useForm<z.infer<typeof editProfileSchema>>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: user?.name || "",
      username: user?.username || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
      bio: user?.bio || "",
      headline: user?.headline || "",
      location: user?.location || "",
      showEmail: false, // Default to private
      showPhone: false, // Default to private
      showLocation: true, // Default to public
    }
  });

  const onSubmit = async (values: z.infer<typeof editProfileSchema>) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Prepare the data to send to the backend
      const updateData = {
        name: values.name,
        username: values.username,
        email: values.email,
        phoneNumber: values.phoneNumber,
        bio: values.bio,
        headline: values.headline,
        location: values.location,
        // Store privacy settings as separate fields
        emailPrivacy: values.showEmail ? 'public' : 'private',
        phonePrivacy: values.showPhone ? 'public' : 'private',
        locationPrivacy: values.showLocation ? 'public' : 'private',
      };

      const response = await apiRequest('PUT', `/api/users/${user.id}`, updateData);
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      toast({
        title: "Profile updated successfully",
        description: "Your profile information has been saved."
      });
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Edit Profile</CardTitle>
              <CardDescription>
                Update your personal information and privacy settings
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'basic'
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="h-4 w-4 mr-2 inline" />
              Basic Information
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'privacy'
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Shield className="h-4 w-4 mr-2 inline" />
              Privacy Settings
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Full Name
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your full name" 
                              {...field} 
                              className="bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Username
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your username" 
                              {...field} 
                              className="bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="Enter your email address" 
                            {...field} 
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone Number
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="tel"
                            placeholder="Enter your phone number" 
                            {...field} 
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="headline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Headline
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Brief description of yourself" 
                            {...field} 
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Location
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your location" 
                            {...field} 
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Bio
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about yourself..." 
                            rows={4}
                            {...field} 
                            className="bg-background resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <div className="text-sm text-muted-foreground">
                    Control who can see your personal information. Private information is only visible to you.
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Email Address</div>
                          <div className="text-sm text-muted-foreground">
                            {form.watch('email') || 'No email set'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name="showEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        {form.watch('showEmail') ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Phone Number</div>
                          <div className="text-sm text-muted-foreground">
                            {form.watch('phoneNumber') || 'No phone number set'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name="showPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        {form.watch('showPhone') ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Location</div>
                          <div className="text-sm text-muted-foreground">
                            {form.watch('location') || 'No location set'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name="showLocation"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        {form.watch('showLocation') ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                      <Shield className="h-4 w-4" />
                      Privacy Note
                    </div>
                    <div className="text-sm text-blue-700">
                      Your email and phone number are used for account security and notifications. 
                      They are only visible to other users when you enable the toggle above.
                    </div>
                  </div>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}