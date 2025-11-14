/**
 * Real-time handler - Manage live session updates
 */

import type { SlidevFeedbackData } from '../types';

export interface RealtimeContext {
  supabase: any;
}

export interface UpdateInput {
  sessionId: string;
  updates: Partial<SlidevFeedbackData>;
  durableObjectId?: string;
}

export async function updateSession(
  input: UpdateInput,
  context: RealtimeContext
): Promise<{ success: boolean; data: SlidevFeedbackData }> {
  const { sessionId, updates } = input;

  // Update database
  const { data, error } = await context.supabase
    .from('slidev_sessions')
    .update({
      ...updates,
      updated_at: new Date(),
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update session: ${error.message}`);
  }

  // Notify Durable Object of updates
  if (input.durableObjectId) {
    await notifyDurableObject(input.durableObjectId, {
      type: 'update',
      data: updates,
    });
  }

  return {
    success: true,
    data,
  };
}

export async function closeSession(
  input: { sessionId: string; durableObjectId?: string },
  context: RealtimeContext
): Promise<{ success: boolean }> {
  const { sessionId } = input;

  // Update session status
  const { error } = await context.supabase
    .from('slidev_sessions')
    .update({
      is_active: false,
      closed_at: new Date(),
      updated_at: new Date(),
    })
    .eq('id', sessionId);

  if (error) {
    throw new Error(`Failed to close session: ${error.message}`);
  }

  // Notify Durable Object
  if (input.durableObjectId) {
    await notifyDurableObject(input.durableObjectId, {
      type: 'close',
    });
  }

  return { success: true };
}

async function notifyDurableObject(
  durableObjectId: string,
  data: any
): Promise<void> {
  try {
    await fetch(
      `https://widgets.amagen.app/feedback/${durableObjectId}/notify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
  } catch (error) {
    console.error('Error notifying Durable Object:', error);
  }
}

export default { updateSession, closeSession };
