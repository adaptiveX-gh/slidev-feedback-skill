/**
 * Type definitions for Slidev Feedback Skill
 */

// Session data structure
export interface SlidevFeedbackData {
  presentationId: string;
  presentationTitle: string;
  slideCount: number;
  allowedReactions: string[];
  enableQuestions: boolean;
  requireAuth: boolean;
  moderateQuestions: boolean;
  currentSlide: number;
  isActive: boolean;
  durableObjectId: string;
  totalParticipants: number;
  theme: 'light' | 'dark' | 'auto';
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

// Widget settings
export interface SlidevFeedbackSettings {
  theme: 'light' | 'dark' | 'auto';
  position: 'top' | 'bottom' | 'floating';
  size: 'compact' | 'normal' | 'large';
  showParticipantCount: boolean;
  showSlideNumber: boolean;
  enableSound: boolean;
  reactionAnimation: 'none' | 'bounce' | 'fade';
  autoHide: boolean;
  autoHideDelay: number; // seconds
}

// Reaction data
export interface Reaction {
  id: string;
  sessionId: string;
  slideNumber: number;
  reactionType: string;
  userId?: string;
  sessionToken: string;
  timestamp: Date;
}

// Question data
export interface Question {
  id: string;
  sessionId: string;
  slideNumber: number;
  questionText: string;
  userId?: string;
  sessionToken: string;
  isApproved: boolean;
  isAnswered: boolean;
  upvotes: number;
  timestamp: Date;
}

// Analytics data
export interface SessionAnalytics {
  sessionId: string;
  totalReactions: number;
  totalQuestions: number;
  totalParticipants: number;
  averageEngagement: number;
  peakEngagementSlide: number;
  reactionsBySlide: Record<number, Record<string, number>>;
  questionsBySlide: Record<number, Question[]>;
  participationTimeline: Array<{
    timestamp: Date;
    count: number;
  }>;
  topReactions: Array<{
    emoji: string;
    count: number;
  }>;
  slideEngagement: Array<{
    slide: number;
    reactions: number;
    questions: number;
    engagement: number;
  }>;
}

// WebSocket message types
export type WSMessage = 
  | { type: 'join'; role: 'presenter' | 'audience'; sessionToken?: string }
  | { type: 'reaction'; emoji: string; slide: number; sessionToken: string }
  | { type: 'question'; text: string; slide: number; sessionToken: string }
  | { type: 'slideChange'; slide: number }
  | { type: 'update'; data: Partial<SlidevFeedbackData> }
  | { type: 'analytics'; data: SessionAnalytics }
  | { type: 'participants'; count: number }
  | { type: 'ping' }
  | { type: 'pong' };

// Export formats
export type ExportFormat = 'json' | 'csv' | 'pdf' | 'markdown';

export interface ExportOptions {
  format: ExportFormat;
  includeReactions: boolean;
  includeQuestions: boolean;
  includeAnalytics: boolean;
  groupBySlide: boolean;
}
