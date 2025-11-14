/**
 * Create handler - Initialize new feedback sessions
 */

import { z } from 'zod';
import { SlidevFeedbackInputSchema } from '../manifest';
import type { SlidevFeedbackData } from '../types';

export interface CreateContext {
  supabase: any; // Simplified for example
  userId: string;
  skillInstanceId: string;
}

export async function createFeedbackSession(
  input: z.infer<typeof SlidevFeedbackInputSchema>,
  context: CreateContext
): Promise<{ success: boolean; data: SlidevFeedbackData; widgetUrl: string; qrCode: string }> {
  try {
    // Validate input
    const validated = SlidevFeedbackInputSchema.parse(input);

    // Generate unique IDs
    const presentationId = crypto.randomUUID();
    const durableObjectId = crypto.randomUUID();

    // Create session data
    const sessionData: SlidevFeedbackData = {
      presentationId,
      presentationTitle: validated.presentationTitle,
      slideCount: validated.slideCount,
      allowedReactions: validated.allowedReactions,
      enableQuestions: validated.enableQuestions,
      requireAuth: validated.requireAuth,
      moderateQuestions: validated.moderateQuestions,
      currentSlide: 1,
      isActive: true,
      durableObjectId,
      totalParticipants: 0,
      theme: validated.theme,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to database
    const { data, error } = await context.supabase
      .from('slidev_sessions')
      .insert({
        id: presentationId,
        skill_instance_id: context.skillInstanceId,
        presentation_title: sessionData.presentationTitle,
        slide_count: sessionData.slideCount,
        allowed_reactions: sessionData.allowedReactions,
        enable_questions: sessionData.enableQuestions,
        require_auth: sessionData.requireAuth,
        moderate_questions: sessionData.moderateQuestions,
        durable_object_id: durableObjectId,
        current_slide: 1,
        is_active: true,
        theme: sessionData.theme,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    // Generate widget URL and QR code
    const widgetUrl = `https://widgets.amagen.app/widget/${context.skillInstanceId}`;
    const qrCode = await generateQRCode(widgetUrl);

    // Initialize Durable Object
    await initializeDurableObject(durableObjectId, sessionData);

    return {
      success: true,
      data: sessionData,
      widgetUrl,
      qrCode,
    };
  } catch (error) {
    console.error('Error creating feedback session:', error);
    throw error;
  }
}

// Helper function to generate QR code
async function generateQRCode(url: string): Promise<string> {
  // Simplified - in real implementation, use qrcode library
  return `data:image/svg+xml;base64,${btoa(`<svg>QR Code for ${url}</svg>`)}`;
}

// Helper function to initialize Durable Object
async function initializeDurableObject(
  durableObjectId: string,
  sessionData: SlidevFeedbackData
): Promise<void> {
  try {
    // Send initialization request to Durable Object
    const response = await fetch(
      `https://widgets.amagen.app/feedback/${durableObjectId}/init`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to initialize Durable Object');
    }
  } catch (error) {
    console.error('Error initializing Durable Object:', error);
    // Non-critical error - session can still function
  }
}

export default createFeedbackSession;
