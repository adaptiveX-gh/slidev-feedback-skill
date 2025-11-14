/**
 * Execute handler - Process feedback submissions
 */

import type { Reaction, Question } from '../types';

export interface ExecuteContext {
  supabase: any;
  userId?: string;
  sessionToken: string;
}

export interface FeedbackInput {
  sessionId: string;
  slideNumber: number;
  type: 'reaction' | 'question';
  value: string; // emoji for reaction, text for question
  durableObjectId: string;
}

export async function submitFeedback(
  input: FeedbackInput,
  context: ExecuteContext
): Promise<{ success: boolean; message: string }> {
  try {
    const { sessionId, slideNumber, type, value, durableObjectId } = input;

    // Validate session exists and is active
    const { data: session, error: sessionError } = await context.supabase
      .from('slidev_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error('Session not found');
    }

    if (!session.is_active) {
      throw new Error('Session is not active');
    }

    if (session.require_auth && !context.userId) {
      throw new Error('Authentication required');
    }

    // Process based on type
    if (type === 'reaction') {
      await submitReaction(sessionId, slideNumber, value, context);
    } else if (type === 'question') {
      await submitQuestion(sessionId, slideNumber, value, session.moderate_questions, context);
    }

    // Send to Durable Object for real-time broadcast
    await notifyDurableObject(durableObjectId, {
      type,
      slideNumber,
      value,
      sessionToken: context.sessionToken,
      userId: context.userId,
    });

    return {
      success: true,
      message: `${type} submitted successfully`,
    };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
}

async function submitReaction(
  sessionId: string,
  slideNumber: number,
  emoji: string,
  context: ExecuteContext
): Promise<void> {
  const reaction: Partial<Reaction> = {
    sessionId,
    slideNumber,
    reactionType: emoji,
    userId: context.userId,
    sessionToken: context.sessionToken,
    timestamp: new Date(),
  };

  const { error } = await context.supabase
    .from('slidev_reactions')
    .insert({
      session_id: sessionId,
      slide_number: slideNumber,
      reaction_type: emoji,
      user_id: context.userId || null,
      session_token: context.sessionToken,
    });

  if (error) {
    throw new Error(`Failed to save reaction: ${error.message}`);
  }
}

async function submitQuestion(
  sessionId: string,
  slideNumber: number,
  text: string,
  moderate: boolean,
  context: ExecuteContext
): Promise<void> {
  const question: Partial<Question> = {
    sessionId,
    slideNumber,
    questionText: text,
    userId: context.userId,
    sessionToken: context.sessionToken,
    isApproved: !moderate, // Auto-approve if not moderating
    isAnswered: false,
    upvotes: 0,
    timestamp: new Date(),
  };

  const { error } = await context.supabase
    .from('slidev_questions')
    .insert({
      session_id: sessionId,
      slide_number: slideNumber,
      question_text: text,
      user_id: context.userId || null,
      session_token: context.sessionToken,
      is_approved: !moderate,
    });

  if (error) {
    throw new Error(`Failed to save question: ${error.message}`);
  }
}

async function notifyDurableObject(
  durableObjectId: string,
  data: any
): Promise<void> {
  try {
    const response = await fetch(
      `https://widgets.amagen.app/feedback/${durableObjectId}/notify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      console.error('Failed to notify Durable Object');
    }
  } catch (error) {
    console.error('Error notifying Durable Object:', error);
  }
}

export default submitFeedback;
