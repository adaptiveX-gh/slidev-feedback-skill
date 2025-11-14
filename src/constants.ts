/**
 * Application Constants
 * Centralized configuration values
 */

/**
 * Default widget base URL for WebSocket connections
 * Can be overridden via environment variables or props
 */
export const DEFAULT_WIDGET_BASE_URL = process.env.VITE_WIDGET_BASE_URL || 'https://widgets.amagen.app';

/**
 * Default WebSocket protocol
 */
export const DEFAULT_WS_PROTOCOL = 'wss://';

/**
 * Default session timeout in minutes
 */
export const DEFAULT_SESSION_TIMEOUT = 120;

/**
 * Widget configuration defaults
 */
export const DEFAULT_WIDGET_CONFIG = {
  theme: 'auto' as const,
  showParticipantCount: true,
  reactionSize: 'medium' as const,
  enableSound: false,
  autoAdvanceSlides: false,
  sessionTimeout: DEFAULT_SESSION_TIMEOUT,
};

/**
 * Default reaction emoji sets
 */
export const DEFAULT_REACTIONS = ['👍', '❤️', '😂', '🤔', '👏', '🎉'];

/**
 * WebSocket connection configuration
 */
export const WS_CONFIG = {
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  heartbeatInterval: 30000,
};

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  feedback: '/feedback',
  presenter: '/presenter',
  analytics: '/analytics',
  init: '/init',
  notify: '/notify',
  reactions: '/reactions',
};
