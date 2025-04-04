export interface UserProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  profileImage?: string;
  bio?: string;
  createdAt: string;
}

export interface Event {
  id: number;
  title: string;
  description?: string;
  sportType: string;
  date: string;
  location: string;
  locationCoordinates?: { lat: number; lng: number };
  maxParticipants: number;
  currentParticipants: number;
  isPublic: boolean;
  isFree: boolean;
  cost?: number;
  creatorId: number;
  eventImage?: string;
  createdAt: string;
  creator?: UserProfile;
  participants?: UserProfile[];
}

export interface RSVP {
  id: number;
  eventId: number;
  userId: number;
  status: "approved" | "denied" | "maybe";
  createdAt: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}
