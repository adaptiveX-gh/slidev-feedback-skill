/**
 * Feedback Widget Component
 *
 * Embeddable audience reaction interface for Slidev presentations.
 * Displays on external websites via iframe/script embed.
 *
 * Features:
 * - Real-time WebSocket connection to Durable Object
 * - Emoji reaction buttons
 * - Slide synchronization
 * - Visual feedback on reaction submission
 */

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@amagen/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@amagen/ui/card';
import { Badge } from '@amagen/ui/badge';
import { cn } from '@amagen/ui/utils';
import { DEFAULT_WIDGET_BASE_URL } from '../constants';

export interface FeedbackWidgetProps {
  /** Unique session identifier */
  sessionId: string;

  /** Durable Object ID for WebSocket connection */
  durableObjectId: string;

  /** Array of allowed reaction emojis */
  allowedReactions: string[];

  /** Presentation title */
  presentationTitle?: string;

  /** Widget theme */
  theme?: 'light' | 'dark' | 'auto';

  /** Show participant count */
  showParticipantCount?: boolean;

  /** Reaction button size */
  reactionSize?: 'small' | 'medium' | 'large';

  /** Enable sound effects */
  enableSound?: boolean;

  /** Widget base URL (for WebSocket connection) */
  widgetBaseUrl?: string;
}

interface WebSocketMessage {
  type: 'slideChange' | 'reaction' | 'init' | 'participantCount' | 'error';
  slide?: number;
  emoji?: string;
  count?: number;
  participants?: number;
  message?: string;
}

/**
 * Feedback Widget - Audience Reaction Interface
 */
export function FeedbackWidget({
  sessionId,
  durableObjectId,
  allowedReactions,
  presentationTitle = 'Presentation',
  theme = 'auto',
  showParticipantCount = true,
  reactionSize = 'medium',
  enableSound = false,
  widgetBaseUrl = DEFAULT_WIDGET_BASE_URL
}: FeedbackWidgetProps) {
  // State
  const [currentSlide, setCurrentSlide] = useState(1);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [participants, setParticipants] = useState(0);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});

  // Generate session token for anonymous users
  const [sessionToken] = useState(() => {
    const stored = localStorage.getItem(`slidev-session-${sessionId}`);
    if (stored) return stored;

    const token = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem(`slidev-session-${sessionId}`, token);
    return token;
  });

  /**
   * Play sound effect on reaction
   */
  const playReactionSound = useCallback(() => {
    if (!enableSound) return;

    try {
      // Simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [enableSound]);

  /**
   * Connect to Durable Object via WebSocket
   */
  useEffect(() => {
    const wsUrl = `wss://${widgetBaseUrl.replace(/^https?:\/\//, '')}/feedback/${durableObjectId}`;

    console.log(`[FeedbackWidget] Connecting to ${wsUrl}`);

    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('[FeedbackWidget] Connected to Durable Object');
      setIsConnected(true);
      setError(null);

      // Send initial connection message
      websocket.send(JSON.stringify({
        type: 'connect',
        sessionId,
        sessionToken
      }));
    };

    websocket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'init':
            // Initial state from DO
            if (message.slide) setCurrentSlide(message.slide);
            if (message.participants !== undefined) setParticipants(message.participants);
            break;

          case 'slideChange':
            // Presenter changed slide
            if (message.slide) {
              setCurrentSlide(message.slide);
              setSelectedReaction(null); // Reset reaction on slide change
            }
            break;

          case 'participantCount':
            // Participant count update
            if (message.count !== undefined) {
              setParticipants(message.count);
            }
            break;

          case 'reaction':
            // Someone else reacted (for real-time counts)
            if (message.emoji) {
              setReactionCounts(prev => ({
                ...prev,
                [message.emoji!]: (prev[message.emoji!] || 0) + 1
              }));
            }
            break;

          case 'error':
            console.error('[FeedbackWidget] Error from server:', message.message);
            setError(message.message || 'Connection error');
            break;
        }
      } catch (error) {
        console.error('[FeedbackWidget] Error parsing message:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('[FeedbackWidget] WebSocket error:', error);
      setIsConnected(false);
      setError('Connection error. Please refresh.');
    };

    websocket.onclose = () => {
      console.log('[FeedbackWidget] Disconnected from Durable Object');
      setIsConnected(false);
    };

    setWs(websocket);

    // Cleanup on unmount
    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, [durableObjectId, sessionId, sessionToken, widgetBaseUrl]);

  /**
   * Send reaction to Durable Object
   */
  const sendReaction = useCallback((emoji: string) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setError('Not connected. Please refresh.');
      return;
    }

    // Send reaction
    ws.send(JSON.stringify({
      type: 'reaction',
      emoji,
      slide: currentSlide,
      sessionId,
      sessionToken,
      timestamp: Date.now()
    }));

    // Update local state
    setSelectedReaction(emoji);
    setReactionCounts(prev => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1
    }));

    // Play sound
    playReactionSound();

    // Clear selection after 2 seconds
    setTimeout(() => setSelectedReaction(null), 2000);
  }, [ws, currentSlide, sessionId, sessionToken, playReactionSound]);

  /**
   * Get button size classes
   */
  const getSizeClasses = () => {
    switch (reactionSize) {
      case 'small':
        return 'h-14 text-2xl';
      case 'large':
        return 'h-24 text-5xl';
      case 'medium':
      default:
        return 'h-20 text-4xl';
    }
  };

  /**
   * Get theme classes
   */
  const getThemeClasses = () => {
    if (theme === 'dark') {
      return 'bg-gray-900 text-white border-gray-700';
    } else if (theme === 'light') {
      return 'bg-white text-gray-900 border-gray-200';
    }
    // Auto theme - use system preference
    return 'bg-background text-foreground border-border';
  };

  return (
    <Card className={cn('w-full max-w-md mx-auto', getThemeClasses())}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg truncate">{presentationTitle}</CardTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            {showParticipantCount && (
              <Badge variant="outline" className="text-xs">
                {participants} {participants === 1 ? 'person' : 'people'}
              </Badge>
            )}
            <Badge variant={isConnected ? 'default' : 'destructive'} className="text-xs">
              {isConnected ? '🟢 Live' : '🔴 Offline'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Slide Indicator */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">React to Slide</p>
          <div className="text-3xl font-bold">{currentSlide}</div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Reaction Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {allowedReactions.map((emoji) => (
            <Button
              key={emoji}
              size="lg"
              variant={selectedReaction === emoji ? 'default' : 'outline'}
              onClick={() => sendReaction(emoji)}
              disabled={!isConnected}
              className={cn(
                getSizeClasses(),
                'transition-all duration-200',
                selectedReaction === emoji && 'scale-110 shadow-lg'
              )}
              title={`React with ${emoji}`}
            >
              <div className="flex flex-col items-center justify-center">
                <span>{emoji}</span>
                {reactionCounts[emoji] > 0 && (
                  <span className="text-xs font-normal mt-1 opacity-70">
                    {reactionCounts[emoji]}
                  </span>
                )}
              </div>
            </Button>
          ))}
        </div>

        {/* Feedback Message */}
        {selectedReaction && (
          <div className="text-center text-sm text-muted-foreground animate-in fade-in">
            Reaction sent! {selectedReaction}
          </div>
        )}

        {/* Connection Status */}
        {!isConnected && !error && (
          <div className="text-center text-sm text-muted-foreground">
            Connecting to presentation...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FeedbackWidget;
