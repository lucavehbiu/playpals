export interface UserProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  profileImage?: string;
  bio?: string;
  createdAt: string;
  headline?: string;
  location?: string;
  cover_image?: string;
}

export interface getUserData {
  id: number;
  username: string;
  name: string;
  email: string;
  profileImage: string | null;
  bio: string | null;
  createdAt: string;
  headline: string | null;
  location: string | null;
  cover_image: string | null;
  phoneNumber: string | null;
  isPhoneVerified: boolean;
  hasNoProfessionalExperience: boolean;
  profileCompletionLevel: number;
}

export interface PlayerRating {
  id: number;
  rated_user_id: number;
  rater_user_id: number;
  event_id?: number;
  sport_type: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface Post {
  id: number;
  user_id: number;
  content: string;
  image_url?: string;
  created_at: string;
  user?: UserProfile;
  likes: number;
  comments: number;
}

export interface loginUserData {
  username: string;
  password: string;
}

export interface registerUserData {
  username: string;
  password: string;
  name: string;
  email: string;
  profileImage?: string;
  bio?: string;
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
  status: 'approved' | 'denied' | 'maybe' | 'pending';
  createdAt: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface User {
  id: number;
  username: string;
  name: string | null;
  email: string;
  profileImage: string | null;
  bio: string | null;
  createdAt: string;
  headline: string | null;
  location: string | null;
}

export interface SportsGroup {
  id: number;
  name: string;
  sportType: string;
  description: string | null;
  adminId: number;
  maxMembers: number | null;
  isPrivate: boolean;
  createdAt: string;
}

export interface SportsGroupMember {
  id: number;
  groupId: number;
  userId: number;
  role: string;
  joinedAt: string;
  user?: User;
}
