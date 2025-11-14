/**
 * Presenter Dashboard Component
 *
 * Main interface for presenters to control slides and view audience reactions.
 * Runs in the dashboard context with full admin controls.
 *
 * Features:
 * - Real-time WebSocket connection to Durable Object
 * - Slide navigation controls
 * - Live reaction aggregation and display
 * - Participant count tracking
 * - Session management
 * - Analytics export
 */

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@amagen/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@amagen/ui/card';
import { Badge } from '@amagen/ui/badge';
import { cn } from '@amagen/ui/utils';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  BarChart,
  Download,
  Share2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
} from 'lucide-react';
import { DEFAULT_WIDGET_BASE_URL, DEFAULT_REACTIONS } from '../constants';

export interface PresenterDashboardProps {
  /** Unique session identifier */
  sessionId: string;

  /** Durable Object ID for WebSocket connection */
  durableObjectId: string;

  /** Total number of slides in presentation */
  totalSlides: number;

  /** Presentation title */
  presentationTitle?: string;

  /** Widget base URL (for WebSocket connection) */
  widgetBaseUrl?: string;

  /** Callback when session ends */
  onSessionEnd?: () => void;

  /** Array of allowed reaction emojis */
  allowedReactions?: string[];
}

interface WebSocketMessage {
  type: 'slideChange' | 'reaction' | 'init' | 'participantCount' | 'analytics' | 'error';
  slide?: number;
  emoji?: string;
  count?: number;
  participants?: number;
  analytics?: ReactionAnalytics;
  message?: string;
}

interface ReactionAnalytics {
  slideReactions: Record<number, Record<string, number>>;
  totalReactions: number;
  participantCount: number;
  sessionDuration: number;
}

interface SlideReaction {
  emoji: string;
  count: number;
}

/**
 * Presenter Dashboard - Control Interface
 */
export function PresenterDashboard({
  sessionId,
  durableObjectId,
  totalSlides,
  presentationTitle = 'Presentation',
  widgetBaseUrl = DEFAULT_WIDGET_BASE_URL,
  onSessionEnd,
  allowedReactions = DEFAULT_REACTIONS,
}: PresenterDashboardProps) {
  // State
  const [currentSlide, setCurrentSlide] = useState(1);
  const [participants, setParticipants] = useState(0);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slideReactions, setSlideReactions] = useState<Record<number, Record<string, number>>>({});
  const [currentSlideReactions, setCurrentSlideReactions] = useState<SlideReaction[]>([]);
  const [analytics, setAnalytics] = useState<ReactionAnalytics | null>(null);
  const [sessionStartTime] = useState(Date.now());

  /**
   * Calculate current slide reactions
   */
  useEffect(() => {
    const reactions = slideReactions[currentSlide] || {};
    const reactionArray: SlideReaction[] = allowedReactions
      .map(emoji => ({
        emoji,
        count: reactions[emoji] || 0,
      }))
      .sort((a, b) => b.count - a.count);

    setCurrentSlideReactions(reactionArray);
  }, [currentSlide, slideReactions, allowedReactions]);

  /**
   * Connect to Durable Object via WebSocket
   */
  useEffect(() => {
    const wsUrl = `wss://${widgetBaseUrl.replace(/^https?:\/\//, '')}/presenter/${durableObjectId}`;

    console.log(`[PresenterDashboard] Connecting to ${wsUrl}`);

    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('[PresenterDashboard] Connected to Durable Object');
      setIsConnected(true);
      setError(null);

      // Send initial presenter connection
      websocket.send(
        JSON.stringify({
          type: 'presenterConnect',
          sessionId,
          currentSlide,
          totalSlides,
        })
      );
    };

    websocket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'init':
            // Initial state from DO
            if (message.slide) setCurrentSlide(message.slide);
            if (message.participants !== undefined) setParticipants(message.participants);
            if (message.analytics) {
              setAnalytics(message.analytics);
              setSlideReactions(message.analytics.slideReactions);
            }
            break;

          case 'participantCount':
            // Participant count update
            if (message.count !== undefined) {
              setParticipants(message.count);
            }
            break;

          case 'reaction':
            // New reaction received
            if (message.emoji && message.slide) {
              setSlideReactions((prev) => {
                const slideData = prev[message.slide!] || {};
                return {
                  ...prev,
                  [message.slide!]: {
                    ...slideData,
                    [message.emoji!]: (slideData[message.emoji!] || 0) + 1,
                  },
                };
              });
            }
            break;

          case 'analytics':
            // Analytics update
            if (message.analytics) {
              setAnalytics(message.analytics);
            }
            break;

          case 'error':
            console.error('[PresenterDashboard] Error from server:', message.message);
            setError(message.message || 'Connection error');
            break;
        }
      } catch (error) {
        console.error('[PresenterDashboard] Error parsing message:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('[PresenterDashboard] WebSocket error:', error);
      setIsConnected(false);
      setError('Connection error. Please refresh.');
    };

    websocket.onclose = () => {
      console.log('[PresenterDashboard] Disconnected from Durable Object');
      setIsConnected(false);
    };

    setWs(websocket);

    // Cleanup on unmount
    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, [durableObjectId, sessionId, totalSlides, widgetBaseUrl]);

  /**
   * Change slide and broadcast to audience
   */
  const changeSlide = useCallback(
    (newSlide: number) => {
      if (newSlide < 1 || newSlide > totalSlides || isPaused) return;

      setCurrentSlide(newSlide);

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'slideChange',
            slide: newSlide,
            sessionId,
            timestamp: Date.now(),
          })
        );
      }
    },
    [ws, sessionId, totalSlides, isPaused]
  );

  /**
   * Navigate to previous slide
   */
  const previousSlide = useCallback(() => {
    changeSlide(currentSlide - 1);
  }, [currentSlide, changeSlide]);

  /**
   * Navigate to next slide
   */
  const nextSlide = useCallback(() => {
    changeSlide(currentSlide + 1);
  }, [currentSlide, changeSlide]);

  /**
   * Jump to first slide
   */
  const firstSlide = useCallback(() => {
    changeSlide(1);
  }, [changeSlide]);

  /**
   * Jump to last slide
   */
  const lastSlide = useCallback(() => {
    changeSlide(totalSlides);
  }, [totalSlides, changeSlide]);

  /**
   * Toggle pause state
   */
  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  /**
   * Export analytics data
   */
  const exportAnalytics = useCallback(() => {
    const data = {
      sessionId,
      presentationTitle,
      startTime: new Date(sessionStartTime).toISOString(),
      duration: Math.floor((Date.now() - sessionStartTime) / 1000),
      totalSlides,
      currentSlide,
      participants,
      slideReactions,
      analytics,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sessionId}-analytics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sessionId, presentationTitle, sessionStartTime, totalSlides, currentSlide, participants, slideReactions, analytics]);

  /**
   * End session
   */
  const endSession = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'endSession',
          sessionId,
          timestamp: Date.now(),
        })
      );
      ws.close();
    }
    onSessionEnd?.();
  }, [ws, sessionId, onSessionEnd]);

  /**
   * Get total reaction count for current slide
   */
  const totalCurrentSlideReactions = currentSlideReactions.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{presentationTitle}</h1>
          <p className="text-muted-foreground">Session: {sessionId}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isConnected ? 'default' : 'destructive'} className="text-sm">
            {isConnected ? '🟢 Live' : '🔴 Offline'}
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Users className="h-4 w-4 mr-1" />
            {participants} {participants === 1 ? 'viewer' : 'viewers'}
          </Badge>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Slide Control */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Slide Control</CardTitle>
            <CardDescription>Navigate through your presentation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Slide Display */}
            <div className="text-center">
              <div className="text-6xl font-bold text-primary mb-2">{currentSlide}</div>
              <div className="text-muted-foreground">of {totalSlides} slides</div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={firstSlide}
                disabled={currentSlide === 1 || !isConnected || isPaused}
                title="First slide"
              >
                <SkipBack className="h-5 w-5" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={previousSlide}
                disabled={currentSlide === 1 || !isConnected || isPaused}
                className="w-32"
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Previous
              </Button>

              <Button
                variant={isPaused ? 'default' : 'outline'}
                size="icon"
                onClick={togglePause}
                disabled={!isConnected}
                title={isPaused ? 'Resume' : 'Pause'}
                className="mx-2"
              >
                {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={nextSlide}
                disabled={currentSlide === totalSlides || !isConnected || isPaused}
                className="w-32"
              >
                Next
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={lastSlide}
                disabled={currentSlide === totalSlides || !isConnected || isPaused}
                title="Last slide"
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>

            {isPaused && (
              <div className="text-center text-sm text-muted-foreground bg-yellow-500/10 p-3 rounded-md">
                ⏸️ Presentation is paused. Click play to resume navigation.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Reactions */}
        <Card>
          <CardHeader>
            <CardTitle>Live Reactions</CardTitle>
            <CardDescription>Current slide feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentSlideReactions.length > 0 ? (
                <>
                  {currentSlideReactions.map((reaction) => (
                    <div
                      key={reaction.emoji}
                      className="flex items-center justify-between p-3 bg-accent/50 rounded-lg"
                    >
                      <span className="text-2xl">{reaction.emoji}</span>
                      <Badge variant="secondary" className="text-lg font-semibold">
                        {reaction.count}
                      </Badge>
                    </div>
                  ))}
                  <div className="pt-3 border-t text-center text-sm text-muted-foreground">
                    Total: {totalCurrentSlideReactions} reactions
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No reactions yet on this slide
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Session Analytics */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Session Analytics</CardTitle>
                <CardDescription>Overview of audience engagement</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportAnalytics}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Link
                </Button>
                <Button variant="destructive" size="sm" onClick={endSession}>
                  End Session
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <div className="text-3xl font-bold text-primary">
                  {analytics?.totalReactions || 0}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Total Reactions</div>
              </div>

              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <div className="text-3xl font-bold text-primary">{participants}</div>
                <div className="text-sm text-muted-foreground mt-1">Active Viewers</div>
              </div>

              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <div className="text-3xl font-bold text-primary">
                  {Math.floor((Date.now() - sessionStartTime) / 60000)}m
                </div>
                <div className="text-sm text-muted-foreground mt-1">Session Duration</div>
              </div>

              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <div className="text-3xl font-bold text-primary">
                  {Object.keys(slideReactions).length}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Slides with Reactions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PresenterDashboard;
