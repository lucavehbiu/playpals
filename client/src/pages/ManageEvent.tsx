import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Event } from "@/lib/types";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  CalendarIcon, 
  MapPinIcon, 
  UserIcon, 
  Clock, 
  ArrowLeft, 
  Share2,
  DollarSign,
  Users,
  MessageSquare,
  Globe,
  Lock,
  UserPlus,
  Settings,
  ImageIcon,
  CheckCircle,
  ChevronRight,
  Calendar,
  MessageCircle,
  Edit,
  Trash2,
  Users as UsersIcon,
  ListChecks,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const ManageEvent = () => {
  const { id } = useParams();
  const eventId = parseInt(id as string);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
  // Fetch event details
  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !isNaN(eventId),
  });
  
  // Check if user is authorized to manage this event
  const isEventOwner = event && user && event.creatorId === user.id;
  
  // Redirect if user is not the event owner
  useEffect(() => {
    if (event && user && event.creatorId !== user.id) {
      toast({
        title: "Unauthorized",
        description: "You don't have permission to manage this event",
        variant: "destructive",
      });
      setLocation("/myevents");
    }
  }, [event, user, setLocation, toast]);
  
  // Delete event mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      toast({
        title: "Event Deleted",
        description: "Your event has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/events/user/${user?.id}`] });
      setLocation("/myevents");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete event: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleDeleteEvent = () => {
    deleteMutation.mutate();
    setIsDeleteDialogOpen(false);
  };
  
  const handleEditEvent = () => {
    setLocation(`/events/${eventId}/edit`);
  };
  
  const goBack = () => {
    setLocation("/myevents");
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button variant="ghost" onClick={goBack} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Events
        </Button>
        <div className="text-center p-8 bg-red-50 rounded-lg">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Event</h2>
          <p className="text-red-600 mb-4">
            {error instanceof Error ? error.message : "Event not found or you don't have permission to view it"}
          </p>
          <Button onClick={goBack}>Return to My Events</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Button variant="ghost" onClick={goBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Events
      </Button>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <div className="text-gray-500 flex gap-2 items-center mt-1">
            <Badge className={`${event.isPublic ? 'bg-green-500' : 'bg-amber-500'}`}>
              <span className="flex items-center">
                {event.isPublic ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                {event.isPublic ? 'Public' : 'Private'}
              </span>
            </Badge>
            <Badge className={`${event.sportType === 'basketball' ? 'bg-secondary' : event.sportType === 'tennis' ? 'bg-pink-500' : 'bg-blue-500'}`}>
              {event.sportType.charAt(0).toUpperCase() + event.sportType.slice(1)}
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEditEvent}>
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="details" className="mt-6" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="details">
            <Settings className="h-4 w-4 mr-2" /> Details
          </TabsTrigger>
          <TabsTrigger value="participants">
            <UsersIcon className="h-4 w-4 mr-2" /> Participants
          </TabsTrigger>
          <TabsTrigger value="invitations">
            <ListChecks className="h-4 w-4 mr-2" /> RSVPs & Invites
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
              <CardDescription>Overview of your event details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="aspect-w-16 aspect-h-9 h-48 relative rounded-md overflow-hidden mb-4">
                    <img 
                      src={event.eventImage || `https://source.unsplash.com/random/800x600/?${event.sportType}`} 
                      alt={event.title} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  
                  <div className="mb-4">
                    <Label className="text-sm font-medium text-gray-500 mb-1">Description</Label>
                    <p className="p-3 bg-gray-50 rounded-md text-gray-700 min-h-[100px]">
                      {event.description || "No description provided."}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-1">Date & Time</Label>
                    <div className="flex items-center p-3 bg-gray-50 rounded-md">
                      <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
                      <span>{format(new Date(event.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-1">Location</Label>
                    <div className="flex items-center p-3 bg-gray-50 rounded-md">
                      <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-1">Participation</Label>
                    <div className="flex items-center p-3 bg-gray-50 rounded-md">
                      <Users className="h-5 w-5 mr-2 text-gray-400" />
                      <span>
                        {event.currentParticipants} / {event.maxParticipants} participants
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-1">Pricing</Label>
                    <div className="flex items-center p-3 bg-gray-50 rounded-md">
                      <DollarSign className="h-5 w-5 mr-2 text-gray-400" />
                      <span>
                        {event.isFree ? 'Free' : `$${(event.cost || 0) / 100}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" onClick={handleEditEvent}>
                <Edit className="h-4 w-4 mr-2" /> Edit Details
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
              <CardDescription>Manage people attending your event</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-md font-medium">Current Participants</h3>
                    <p className="text-sm text-gray-500">{event.currentParticipants} / {event.maxParticipants} spots filled</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" /> Invite More
                  </Button>
                </div>
                
                <div className="border rounded-md">
                  {/* This would show actual participants in a real app */}
                  <div className="p-4 flex items-center justify-between border-b">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" />
                        <AvatarFallback>AS</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Alex Smith</p>
                        <p className="text-sm text-gray-500">Host</p>
                      </div>
                    </div>
                    <Badge>Host</Badge>
                  </div>
                  
                  <div className="p-4 flex items-center justify-between border-b">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src="https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" />
                        <AvatarFallback>SC</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Sarah Chen</p>
                        <p className="text-sm text-gray-500">Confirmed</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80" />
                        <AvatarFallback>MR</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Michael Rodriguez</p>
                        <p className="text-sm text-gray-500">Confirmed</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>RSVPs & Invitations</CardTitle>
              <CardDescription>Manage responses and send invites</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium mb-3">Pending RSVPs</h3>
                  <div className="border rounded-md">
                    <div className="p-4 text-center text-gray-500">
                      {/* This would show actual pending RSVPs in a real app */}
                      No pending RSVPs at the moment.
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-md font-medium">Send Invitations</h3>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" /> Invite Friends
                    </Button>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md text-center text-gray-500">
                    <UserPlus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>You can invite friends, teammates or participants from previous events.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-medium">Event: {event.title}</p>
            <p className="text-sm text-gray-500 mt-1">
              {format(new Date(event.date), "EEE, MMM d • h:mm a")} at {event.location}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteEvent}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageEvent;