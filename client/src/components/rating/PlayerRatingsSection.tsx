import { Star, MessageSquare, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface PlayerRating {
  id: number;
  rating: number;
  comment: string | null;
  sportType: string;
  createdAt: string;
  rater: {
    id: number;
    name: string;
    profileImage: string | null;
  };
}

interface PlayerRatingsSectionProps {
  ratings: PlayerRating[];
  averageRating: number | null;
  totalRatings: number;
  isOwnProfile: boolean;
}

export default function PlayerRatingsSection({ 
  ratings, 
  averageRating, 
  totalRatings, 
  isOwnProfile 
}: PlayerRatingsSectionProps) {
  if (!ratings || ratings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Player Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {isOwnProfile 
              ? "You haven't received any ratings yet. Play more events to get feedback from other players!" 
              : "This player hasn't received any ratings yet."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatSportName = (sport: string) => {
    return sport.charAt(0).toUpperCase() + sport.slice(1);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Player Ratings
          </div>
          {averageRating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {renderStars(Math.round(averageRating))}
              </div>
              <span className="text-lg font-semibold">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">
                ({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})
              </span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ratings.map((rating) => (
            <div 
              key={rating.id} 
              className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={rating.rater.profileImage || undefined} />
                  <AvatarFallback>
                    {rating.rater.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rating.rater.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {formatSportName(rating.sportType)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(rating.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {renderStars(rating.rating)}
                    <span className="text-sm font-medium">
                      {rating.rating}/5
                    </span>
                  </div>
                  
                  {rating.comment && (
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        "{rating.comment}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}