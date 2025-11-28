import { Star, MessageSquare, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

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
  isOwnProfile,
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
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-xl">
              <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
            </div>
            <span className="text-xl font-bold tracking-tight">Player Ratings</span>
          </div>
          {averageRating && (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
                <div className="flex items-center gap-0.5">
                  {renderStars(Math.round(averageRating))}
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {totalRatings} {totalRatings === 1 ? 'Review' : 'Reviews'}
              </span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mt-2">
          {ratings.map((rating) => (
            <div
              key={rating.id}
              className="group relative bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  <AvatarImage src={rating.rater.profileImage || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold">
                    {rating.rater.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-gray-900 truncate pr-2">{rating.rater.name}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(rating.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant="secondary"
                      className="rounded-lg px-2 py-0.5 text-xs font-medium bg-white shadow-sm"
                    >
                      {formatSportName(rating.sportType)}
                    </Badge>
                    <div className="flex items-center gap-0.5">{renderStars(rating.rating)}</div>
                  </div>

                  {rating.comment && (
                    <div className="relative mt-2 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                      <MessageSquare className="absolute top-3 left-3 h-3 w-3 text-gray-300" />
                      <p className="text-sm text-gray-600 pl-5 leading-relaxed">{rating.comment}</p>
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
