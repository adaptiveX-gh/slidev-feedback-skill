/**
 * Analytics handler - Generate feedback statistics and insights
 */

import type { SessionAnalytics, Reaction, Question } from '../types';

export interface AnalyticsContext {
  supabase: any;
}

export async function getFeedbackResults(
  input: { sessionId: string },
  context: AnalyticsContext
): Promise<{ reactions: Reaction[]; questions: Question[] }> {
  const { sessionId } = input;

  // Get reactions
  const { data: reactions, error: reactionsError } = await context.supabase
    .from('slidev_reactions')
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: false });

  if (reactionsError) {
    console.error('Error fetching reactions:', reactionsError);
  }

  // Get questions
  const { data: questions, error: questionsError } = await context.supabase
    .from('slidev_questions')
    .select('*')
    .eq('session_id', sessionId)
    .eq('is_approved', true)
    .order('upvotes', { ascending: false });

  if (questionsError) {
    console.error('Error fetching questions:', questionsError);
  }

  return {
    reactions: reactions || [],
    questions: questions || [],
  };
}

export async function getSessionAnalytics(
  input: { sessionId: string },
  context: AnalyticsContext
): Promise<SessionAnalytics> {
  const { sessionId } = input;

  // Get session data
  const { data: session } = await context.supabase
    .from('slidev_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!session) {
    throw new Error('Session not found');
  }

  // Get all reactions
  const { data: reactions } = await context.supabase
    .from('slidev_reactions')
    .select('*')
    .eq('session_id', sessionId);

  // Get all questions
  const { data: questions } = await context.supabase
    .from('slidev_questions')
    .select('*')
    .eq('session_id', sessionId);

  // Calculate analytics
  const reactionsBySlide: Record<number, Record<string, number>> = {};
  const questionsBySlide: Record<number, Question[]> = {};
  const uniqueParticipants = new Set<string>();
  const topReactions: Record<string, number> = {};

  // Process reactions
  reactions?.forEach((reaction: any) => {
    const slideNum = reaction.slide_number;
    const emoji = reaction.reaction_type;

    if (!reactionsBySlide[slideNum]) {
      reactionsBySlide[slideNum] = {};
    }
    reactionsBySlide[slideNum][emoji] = (reactionsBySlide[slideNum][emoji] || 0) + 1;

    topReactions[emoji] = (topReactions[emoji] || 0) + 1;
    uniqueParticipants.add(reaction.session_token);
  });

  // Process questions
  questions?.forEach((question: any) => {
    const slideNum = question.slide_number;
    if (!questionsBySlide[slideNum]) {
      questionsBySlide[slideNum] = [];
    }
    questionsBySlide[slideNum].push(question);
    uniqueParticipants.add(question.session_token);
  });

  // Calculate slide engagement
  const slideEngagement = [];
  for (let i = 1; i <= session.slide_count; i++) {
    const slideReactions = Object.values(reactionsBySlide[i] || {}).reduce((a, b) => a + b, 0);
    const slideQuestions = questionsBySlide[i]?.length || 0;
    slideEngagement.push({
      slide: i,
      reactions: slideReactions,
      questions: slideQuestions,
      engagement: slideReactions + slideQuestions * 2, // Weight questions higher
    });
  }

  // Find peak engagement slide
  const peakSlide = slideEngagement.reduce((max, current) => 
    current.engagement > max.engagement ? current : max
  );

  // Sort top reactions
  const sortedTopReactions = Object.entries(topReactions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([emoji, count]) => ({ emoji, count }));

  // Calculate average engagement
  const totalEngagement = slideEngagement.reduce((sum, slide) => sum + slide.engagement, 0);
  const averageEngagement = Math.round((totalEngagement / session.slide_count) * 100) / 100;

  return {
    sessionId,
    totalReactions: reactions?.length || 0,
    totalQuestions: questions?.length || 0,
    totalParticipants: uniqueParticipants.size,
    averageEngagement,
    peakEngagementSlide: peakSlide.slide,
    reactionsBySlide,
    questionsBySlide,
    topReactions: sortedTopReactions,
    slideEngagement,
    participationTimeline: [], // Could be implemented with timestamp grouping
  };
}

export default { getFeedbackResults, getSessionAnalytics };
