import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Shield,
  Save,
  X,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const editProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Please enter a valid email address'),
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
      name: user?.name || '',
      username: user?.username || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      bio: user?.bio || '',
      headline: user?.headline || '',
      location: user?.location || '',
      showEmail: user?.emailPrivacy === 'public',
      showPhone: user?.phonePrivacy === 'public',
      showLocation: user?.locationPrivacy === 'public',
    },
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
        title: 'Profile updated successfully',
        description: 'Your profile information has been saved.',
      });

      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error updating profile',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white/50">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Edit Profile
            </h2>
            <p className="text-sm text-gray-500 mt-1">Customize your public persona</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-6 border-b border-gray-100 bg-white/30">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'basic'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="h-4 w-4 mr-2 inline" />
            Basic Info
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'privacy'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield className="h-4 w-4 mr-2 inline" />
            Privacy
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <AnimatePresence mode="wait">
                {activeTab === 'basic' ? (
                  <motion.div
                    key="basic"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Full Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  placeholder="John Doe"
                                  {...field}
                                  className="pl-10 rounded-xl border-gray-200 bg-white/50 focus:bg-white transition-all"
                                />
                              </div>
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
                            <FormLabel className="text-gray-700 font-medium">Username</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-400 text-sm">
                                  @
                                </span>
                                <Input
                                  placeholder="johndoe"
                                  {...field}
                                  className="pl-8 rounded-xl border-gray-200 bg-white/50 focus:bg-white transition-all"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="headline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Headline</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Sparkles className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Tennis Enthusiast | Weekend Warrior"
                                {...field}
                                className="pl-10 rounded-xl border-gray-200 bg-white/50 focus:bg-white transition-all"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  type="email"
                                  placeholder="john@example.com"
                                  {...field}
                                  className="pl-10 rounded-xl border-gray-200 bg-white/50 focus:bg-white transition-all"
                                />
                              </div>
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
                            <FormLabel className="text-gray-700 font-medium">Phone</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  type="tel"
                                  placeholder="+1 (555) 000-0000"
                                  {...field}
                                  className="pl-10 rounded-xl border-gray-200 bg-white/50 focus:bg-white transition-all"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Location</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="New York, NY"
                                {...field}
                                className="pl-10 rounded-xl border-gray-200 bg-white/50 focus:bg-white transition-all"
                              />
                            </div>
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
                          <FormLabel className="text-gray-700 font-medium">Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us about your sports journey..."
                              rows={4}
                              {...field}
                              className="rounded-xl border-gray-200 bg-white/50 focus:bg-white transition-all resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="privacy"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-900">Privacy Control</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Manage what others can see on your profile. Private information is only
                            visible to you.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        {
                          name: 'showEmail',
                          label: 'Email Address',
                          icon: Mail,
                          value: form.watch('email'),
                        },
                        {
                          name: 'showPhone',
                          label: 'Phone Number',
                          icon: Phone,
                          value: form.watch('phoneNumber'),
                        },
                        {
                          name: 'showLocation',
                          label: 'Location',
                          icon: MapPin,
                          value: form.watch('location'),
                        },
                      ].map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-gray-50 rounded-xl">
                              <item.icon className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{item.label}</div>
                              <div className="text-sm text-gray-500">
                                {item.value || `No ${item.label.toLowerCase()} set`}
                              </div>
                            </div>
                          </div>
                          <FormField
                            control={form.control}
                            name={item.name as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                      {field.value ? 'Public' : 'Private'}
                                    </span>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </Form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl border-gray-200 hover:bg-white hover:text-red-500 hover:border-red-100"
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isLoading}
            className="rounded-xl bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
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
      </motion.div>
    </div>
  );
}
