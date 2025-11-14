/**
 * Slidev Real-time Feedback Skill Manifest
 * ISkill implementation for Amagen platform
 */

import type { ISkill } from '@amagen/core';
import {
  SkillCategory,
  ExecutionContext,
  ExecutionMode,
  StorageBackend,
} from '@amagen/core';
import { z } from 'zod';
import type { 
  SlidevFeedbackData, 
  SlidevFeedbackSettings 
} from './types';

// Input schema for creating a feedback session
export const SlidevFeedbackInputSchema = z.object({
  presentationTitle: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters')
    .describe('Presentation title'),
  
  slideCount: z.number()
    .int()
    .min(1)
    .max(500)
    .default(20)
    .describe('Total number of slides'),
  
  allowedReactions: z.array(z.string())
    .min(1, 'Select at least one reaction')
    .max(10, 'Maximum 10 reactions allowed')
    .default(['👍', '❤️', '🔥', '🤔', '👏'])
    .describe('Allowed reaction emojis'),
  
  enableQuestions: z.boolean()
    .default(true)
    .describe('Allow audience to submit questions'),
  
  requireAuth: z.boolean()
    .default(false)
    .describe('Require authentication to react'),
  
  sessionDuration: z.number()
    .optional()
    .describe('Auto-close after N hours'),
  
  moderateQuestions: z.boolean()
    .default(false)
    .describe('Review questions before display'),

  theme: z.enum(['light', 'dark', 'auto'])
    .default('auto')
    .describe('Widget theme')
});

/**
 * Slidev Real-time Feedback Skill
 */
const slidevFeedbackSkill: ISkill<
  SlidevFeedbackData,
  z.infer<typeof SlidevFeedbackInputSchema>,
  SlidevFeedbackSettings
> = {
  // ============================================================
  // Core Metadata
  // ============================================================
  id: 'slidev-feedback',
  name: 'Slidev Real-time Feedback',
  description: 'Enable live audience reactions and feedback during Slidev presentations with WebSocket-powered real-time updates',
  version: '1.0.0',
  icon: '📊',
  category: SkillCategory.ENGAGEMENT,

  // Execution contexts
  contexts: [
    ExecutionContext.DASHBOARD,
    ExecutionContext.EMBEDDED,
    ExecutionContext.UNIVERSAL
  ],
  executionMode: ExecutionMode.REALTIME,

  // ============================================================
  // Capabilities
  // ============================================================
  features: {
    realtime: true,        // WebSocket real-time updates
    ai: false,             // No AI needed for this skill
    adaptive: true,        // Adapts to slide changes
    analytics: true,       // Detailed feedback analytics
    collaborative: true,   // Multiple participants
    offline: false,        // Requires connection
    requiresAuth: false,   // Optional authentication
  },

  // ============================================================
  // Components (Lazy Loaded)
  // ============================================================
  components: {
    // Audience widget (embedded)
    widget: async () => {
      const { FeedbackWidget } = await import('./components/FeedbackWidget');
      return { default: FeedbackWidget };
    },

    // Presenter dashboard
    creator: async () => {
      const { PresenterDashboard } = await import('./components/PresenterDashboard');
      return { default: PresenterDashboard };
    },

    // Configuration UI
    preview: async () => {
      const { ConfigCreator } = await import('./components/ConfigCreator');
      return { default: ConfigCreator };
    },

    // Settings panel
    settings: async () => {
      const { SettingsPanel } = await import('./components/SettingsPanel');
      return { default: SettingsPanel };
    },
  },

  // ============================================================
  // Server-side Handlers
  // ============================================================
  handlers: {
    // Create new feedback session
    create: async (input, context) => {
      const { createFeedbackSession } = await import('./handlers/create');
      return createFeedbackSession(input, context);
    },

    // Submit feedback (reaction/question)
    execute: async (input, context) => {
      const { submitFeedback } = await import('./handlers/execute');
      return submitFeedback(input, context);
    },

    // Get current results
    getResults: async (input, context) => {
      const { getFeedbackResults } = await import('./handlers/analytics');
      return getFeedbackResults(input, context);
    },

    // Get analytics summary
    getAnalytics: async (input, context) => {
      const { getSessionAnalytics } = await import('./handlers/analytics');
      return getSessionAnalytics(input, context);
    },

    // Update session (slide change, settings)
    update: async (input, context) => {
      const { updateSession } = await import('./handlers/realtime');
      return updateSession(input, context);
    },

    // Export data
    export: async (input, context) => {
      const { exportFeedback } = await import('./handlers/export');
      return exportFeedback(input, context);
    },

    // End session
    delete: async (input, context) => {
      const { closeSession } = await import('./handlers/realtime');
      return closeSession(input, context);
    },
  },

  // ============================================================
  // Input Schema
  // ============================================================
  schema: SlidevFeedbackInputSchema,

  // ============================================================
  // Storage Requirements
  // ============================================================
  storage: {
    backend: StorageBackend.SUPABASE,
    tables: [
      {
        name: 'slidev_sessions',
        columns: [
          { name: 'id', type: 'uuid', primaryKey: true },
          { name: 'skill_instance_id', type: 'uuid', required: true },
          { name: 'presentation_title', type: 'text', required: true },
          { name: 'slide_count', type: 'integer', required: true },
          { name: 'allowed_reactions', type: 'jsonb', required: true },
          { name: 'enable_questions', type: 'boolean', default: 'true' },
          { name: 'require_auth', type: 'boolean', default: 'false' },
          { name: 'moderate_questions', type: 'boolean', default: 'false' },
          { name: 'durable_object_id', type: 'text', required: true },
          { name: 'current_slide', type: 'integer', default: '1' },
          { name: 'is_active', type: 'boolean', default: 'true' },
          { name: 'total_participants', type: 'integer', default: '0' },
          { name: 'theme', type: 'text', default: 'auto' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'closed_at', type: 'timestamp', nullable: true },
        ],
      },
      {
        name: 'slidev_reactions',
        columns: [
          { name: 'id', type: 'uuid', primaryKey: true },
          { name: 'session_id', type: 'uuid', required: true },
          { name: 'slide_number', type: 'integer', required: true },
          { name: 'reaction_type', type: 'text', required: true },
          { name: 'user_id', type: 'uuid', nullable: true },
          { name: 'session_token', type: 'text', required: true },
          { name: 'ip_hash', type: 'text', nullable: true },
          { name: 'timestamp', type: 'timestamp', default: 'now()' },
        ],
      },
      {
        name: 'slidev_questions',
        columns: [
          { name: 'id', type: 'uuid', primaryKey: true },
          { name: 'session_id', type: 'uuid', required: true },
          { name: 'slide_number', type: 'integer', required: true },
          { name: 'question_text', type: 'text', required: true },
          { name: 'user_id', type: 'uuid', nullable: true },
          { name: 'session_token', type: 'text', required: true },
          { name: 'is_approved', type: 'boolean', default: 'true' },
          { name: 'is_answered', type: 'boolean', default: 'false' },
          { name: 'upvotes', type: 'integer', default: '0' },
          { name: 'timestamp', type: 'timestamp', default: 'now()' },
        ],
      },
    ],
    indexes: [
      { 
        name: 'slidev_reactions_session_slide', 
        table: 'slidev_reactions',
        columns: ['session_id', 'slide_number'] 
      },
      { 
        name: 'slidev_questions_session_slide', 
        table: 'slidev_questions',
        columns: ['session_id', 'slide_number'] 
      },
      {
        name: 'slidev_sessions_instance',
        table: 'slidev_sessions',
        columns: ['skill_instance_id']
      }
    ],
  },

  // ============================================================
  // Durable Object Configuration
  // ============================================================
  durableObject: {
    enabled: true,
    className: 'SlidevFeedbackDO',
    bindings: {
      FEEDBACK_DO: 'SlidevFeedbackDO',
    },
    migrations: [
      {
        tag: 'v1',
        new_classes: ['SlidevFeedbackDO'],
      },
    ],
  },

  // ============================================================
  // Lifecycle Hooks
  // ============================================================
  hooks: {
    beforeCreate: async (input) => {
      // Validate and sanitize input
      if (!input.presentationTitle?.trim()) {
        throw new Error('Presentation title is required');
      }
      
      // Ensure valid emoji reactions
      const validEmojis = input.allowedReactions.filter(e => 
        /\p{Emoji}/u.test(e)
      );
      
      if (validEmojis.length === 0) {
        throw new Error('At least one valid emoji reaction is required');
      }
      
      return {
        ...input,
        allowedReactions: validEmojis,
        presentationTitle: input.presentationTitle.trim()
      };
    },

    afterCreate: async (instance) => {
      console.log(`✅ Feedback session created: ${instance.data.presentationTitle}`);
      console.log(`🔗 Widget URL: https://widgets.amagen.app/widget/${instance.id}`);
    },

    afterInteraction: async (data, type) => {
      if (type === 'reaction') {
        console.log(`👍 Reaction recorded on slide ${data.slideNumber}`);
      } else if (type === 'question') {
        console.log(`❓ Question submitted on slide ${data.slideNumber}`);
      }
    },

    beforeDelete: async (instance) => {
      console.log(`🗑️ Closing feedback session: ${instance.data.presentationTitle}`);
    },

    onError: async (error, context) => {
      console.error('❌ Feedback session error:', error);
      // Could send to error tracking service
    },
  },

  // ============================================================
  // Metadata
  // ============================================================
  metadata: {
    author: {
      name: 'Your Name',
      email: 'you@example.com',
      url: 'https://github.com/YOUR_USERNAME',
    },
    license: 'MIT',
    tags: [
      'slidev', 
      'presentation', 
      'feedback', 
      'realtime', 
      'websocket', 
      'durable-objects',
      'audience-engagement',
      'interactive',
      'polls'
    ],
    minPlatformVersion: '0.1.0',
    maxPlatformVersion: null,
    beta: false,
    featured: true,

    // External URLs
    repository: 'https://github.com/YOUR_USERNAME/slidev-feedback-skill',
    documentation: 'https://github.com/YOUR_USERNAME/slidev-feedback-skill#readme',
    homepage: 'https://your-website.com/slidev-feedback',
    issues: 'https://github.com/YOUR_USERNAME/slidev-feedback-skill/issues',

    // Examples
    examples: [
      {
        title: 'Workshop Feedback',
        description: 'Collect questions and understanding checks',
        config: {
          presentationTitle: 'React Workshop',
          slideCount: 30,
          allowedReactions: ['✅', '❓', '💡', '👏'],
          enableQuestions: true,
          moderateQuestions: false
        }
      },
      {
        title: 'Conference Talk',
        description: 'Quick reactions for large audiences',
        config: {
          presentationTitle: 'Future of AI',
          slideCount: 45,
          allowedReactions: ['❤️', '🔥', '😮', '🤔', '👏'],
          enableQuestions: false,
          requireAuth: false
        }
      }
    ],

    // Changelog
    changelog: [
      {
        version: '1.0.0',
        date: '2025-01-13',
        changes: [
          'Initial release as Amagen skill',
          'Real-time WebSocket reactions',
          'Durable Objects integration',
          'Presenter dashboard',
          'Question submission',
          'Analytics export',
          'QR code generation',
          'Mobile-optimized widget'
        ],
      },
    ],
  },
};

export default slidevFeedbackSkill;
