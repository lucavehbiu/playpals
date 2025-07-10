import { getUserData } from "@/lib/types";

export interface ProfileCompletionStatus {
  completionPercentage: number;
  isComplete: boolean;
  completedSections: string[];
  missingSections: string[];
  showRibbon: boolean;
}

export interface ProfileCompletionData {
  user: getUserData | null;
  sportSkillLevels: any[];
  professionalTeamHistory: any[];
}

export function calculateProfileCompletion(data: ProfileCompletionData): ProfileCompletionStatus {
  const { user, sportSkillLevels, professionalTeamHistory } = data;
  
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

  // Debug logging
  console.log('Profile completion calculation:', {
    user: {
      name: user.name,
      bio: user.bio,
      location: user.location,
      isPhoneVerified: user.isPhoneVerified,
      hasNoProfessionalExperience: user.hasNoProfessionalExperience
    },
    sportSkillLevels: sportSkillLevels?.length || 0,
    professionalTeamHistory: professionalTeamHistory?.length || 0,
    sportSkillLevelsData: sportSkillLevels,
    professionalTeamHistoryData: professionalTeamHistory,
    completedSections: [],
    missingSections: []
  });

  console.log('Expected completion: Basic Info (✓), Sport Skills (' + (sportSkillLevels?.length > 0 ? '✓' : '❌') + '), Team History (' + (user.hasNoProfessionalExperience ? '✓' : '❌') + '), Phone (' + (user.isPhoneVerified ? '✓' : '❌') + ')');

  // Check basic info - user has at least name and bio
  let basicInfoScore = 0;
  if (user.name && user.name.trim() !== '') basicInfoScore++;
  if (user.bio && user.bio.trim() !== '') basicInfoScore++;
  if (user.location && user.location.trim() !== '') basicInfoScore++;
  
  // Consider basic info complete if user has name and bio
  if (basicInfoScore >= 2) {
    completedSections.push('basic-info');
  } else {
    missingSections.push('basic-info');
  }

  // Check phone verification - use actual verification status
  if (user.isPhoneVerified) {
    completedSections.push('phone-verification');
  } else {
    missingSections.push('phone-verification');
  }

  // Check sport skills - user needs at least one sport skill level
  if (sportSkillLevels && sportSkillLevels.length > 0) {
    completedSections.push('sport-skills');
  } else {
    missingSections.push('sport-skills');
  }

  // Check team history - user needs at least one entry or marked as "no professional experience"
  if ((professionalTeamHistory && professionalTeamHistory.length > 0) || user.hasNoProfessionalExperience) {
    completedSections.push('team-history');
  } else {
    missingSections.push('team-history');
  }

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