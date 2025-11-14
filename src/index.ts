/**
 * Slidev Real-time Feedback Skill
 * Main entry point and exports
 */

export { default as slidevFeedbackSkill } from './manifest';
export * from './manifest';
export * from './types';

// Export components for direct use
export { PresenterDashboard } from './components/PresenterDashboard';
export { FeedbackWidget } from './components/FeedbackWidget';
export { ConfigCreator } from './components/ConfigCreator';
export { SettingsPanel } from './components/SettingsPanel';

// Export handlers for testing
export * from './handlers/create';
export * from './handlers/execute';
export * from './handlers/analytics';
export * from './handlers/realtime';

// Export Durable Object classes
export { SlidevFeedbackDO } from './durable-objects/SlidevFeedbackDO';

// Version info
export const version = '1.0.0';
export const skillId = 'slidev-feedback';
