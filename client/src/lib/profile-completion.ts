import { getUserData } from "@/lib/types";

export interface ProfileCompletionStatus {
  completionPercentage: number;
  isComplete: boolean;
  completedSections: string[];
  missingSections: string[];
  showRibbon: boolean;
}

export function calculateProfileCompletion(user: getUserData | null): ProfileCompletionStatus {
  if (!user) {
    return {
      completionPercentage: 0,
      isComplete: false,
      completedSections: [],
      missingSections: ['basic-info', 'phone-verification', 'sport-skills', 'team-history'],
      showRibbon: false
    };
  }

  const completedSections: string[] = [];
  const missingSections: string[] = [];

  // Check basic info (name, bio, location)
  if (user.name && user.bio && user.location) {
    completedSections.push('basic-info');
  } else {
    missingSections.push('basic-info');
  }

  // Check phone verification (placeholder - would need actual phone verification status)
  // For now, we'll assume no phone verification initially
  missingSections.push('phone-verification');

  // Check sport skills (placeholder - would need actual sport skills data)
  // For now, we'll assume no sport skills initially
  missingSections.push('sport-skills');

  // Check team history (placeholder - would need actual team history data)  
  // For now, we'll assume no team history initially
  missingSections.push('team-history');

  const completionPercentage = Math.round((completedSections.length / 4) * 100);
  const isComplete = completionPercentage === 100;
  const showRibbon = completionPercentage < 100 && completionPercentage > 0;

  return {
    completionPercentage,
    isComplete,
    completedSections,
    missingSections,
    showRibbon
  };
}