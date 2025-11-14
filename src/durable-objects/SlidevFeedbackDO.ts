/**
 * Slidev Feedback Durable Object
 * Manages WebSocket connections and real-time state
 */

import type { DurableObjectState, DurableObjectNamespace } from '@cloudflare/workers-types';

export class SlidevFeedbackDO {
  private state: DurableObjectState;
  private sessions: Map<WebSocket, { role: string; sessionToken: string }>;
  private reactions: Map<string, number>;
  private currentSlide: number;
  private sessionData: any;
  private participants: Set<string>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Map();
    this.reactions = new Map();
    this.currentSlide = 1;
    this.participants = new Set();

    // Restore state from storage
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get(['currentSlide', 'reactions', 'sessionData']);
      this.currentSlide = (stored.get('currentSlide') as number) || 1;

      // Convert stored object back to Map
      const reactionsObj = (stored.get('reactions') as Record<string, number>) || {};
      this.reactions = new Map(Object.entries(reactionsObj));

      this.sessionData = stored.get('sessionData') || {};
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    // Handle HTTP endpoints
    switch (url.pathname) {
      case '/init':
        return this.handleInit(request);
      case '/notify':
        return this.handleNotify(request);
      case '/reactions':
        return this.getReactions();
      case '/analytics':
        return this.getAnalytics();
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.state.acceptWebSocket(server);

    server.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(event.data as string);
        await this.handleWebSocketMessage(server, message);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    server.addEventListener('close', () => {
      const session = this.sessions.get(server);
      if (session?.sessionToken) {
        this.participants.delete(session.sessionToken);
      }
      this.sessions.delete(server);
      this.broadcastParticipantCount();
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private async handleWebSocketMessage(ws: WebSocket, message: any): Promise<void> {
    switch (message.type) {
      case 'join':
        this.sessions.set(ws, {
          role: message.role,
          sessionToken: message.sessionToken || `anon-${Date.now()}`,
        });
        
        if (message.sessionToken) {
          this.participants.add(message.sessionToken);
        }

        // Send initial state
        ws.send(JSON.stringify({
          type: 'init',
          currentSlide: this.currentSlide,
          reactions: Object.fromEntries(this.reactions),
          participants: this.participants.size,
        }));

        this.broadcastParticipantCount();
        break;

      case 'reaction':
        await this.handleReaction(message);
        break;

      case 'question':
        await this.handleQuestion(message);
        break;

      case 'slideChange':
        await this.handleSlideChange(message.slide);
        break;

      case 'update':
        await this.handleUpdate(message.data);
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
    }
  }

  private async handleReaction(message: any): Promise<void> {
    const key = `${message.slide}-${message.emoji}`;
    const current = this.reactions.get(key) || 0;
    this.reactions.set(key, current + 1);

    // Persist to storage - convert Map to object for serialization
    await this.state.storage.put('reactions', Object.fromEntries(this.reactions));

    // Broadcast to all clients
    this.broadcast({
      type: 'reaction',
      emoji: message.emoji,
      slide: message.slide,
      count: current + 1,
    });
  }

  private async handleQuestion(message: any): Promise<void> {
    // Broadcast new question to presenters only
    this.broadcastToPresenters({
      type: 'question',
      text: message.text,
      slide: message.slide,
      sessionToken: message.sessionToken,
    });
  }

  private async handleSlideChange(slide: number): Promise<void> {
    this.currentSlide = slide;
    
    // Persist to storage
    await this.state.storage.put('currentSlide', this.currentSlide);

    // Broadcast to all clients
    this.broadcast({
      type: 'slideChange',
      slide: this.currentSlide,
    });
  }

  private async handleUpdate(data: any): Promise<void> {
    // Update session data
    this.sessionData = { ...this.sessionData, ...data };
    
    // Persist to storage
    await this.state.storage.put('sessionData', this.sessionData);

    // Broadcast updates
    this.broadcast({
      type: 'update',
      data,
    });
  }

  private async handleInit(request: Request): Promise<Response> {
    try {
      const data = await request.json();
      this.sessionData = data;
      
      // Persist to storage
      await this.state.storage.put('sessionData', this.sessionData);

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to initialize' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  private async handleNotify(request: Request): Promise<Response> {
    try {
      const data = await request.json();
      
      // Broadcast notification to all connected clients
      this.broadcast(data);

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to notify' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  private async getReactions(): Promise<Response> {
    const slideReactions: Record<number, Record<string, number>> = {};
    
    this.reactions.forEach((count, key) => {
      const [slide, emoji] = key.split('-');
      const slideNum = parseInt(slide);
      
      if (!slideReactions[slideNum]) {
        slideReactions[slideNum] = {};
      }
      slideReactions[slideNum][emoji] = count;
    });

    return new Response(
      JSON.stringify({
        currentSlide: this.currentSlide,
        reactions: slideReactions,
        participants: this.participants.size,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  private async getAnalytics(): Promise<Response> {
    const analytics = {
      totalReactions: Array.from(this.reactions.values()).reduce((a, b) => a + b, 0),
      totalParticipants: this.participants.size,
      currentSlide: this.currentSlide,
      sessionData: this.sessionData,
    };

    return new Response(JSON.stringify(analytics), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private broadcast(message: any): void {
    const data = JSON.stringify(message);
    this.sessions.forEach((_, ws) => {
      try {
        ws.send(data);
      } catch (error) {
        // Remove failed connections
        this.sessions.delete(ws);
      }
    });
  }

  private broadcastToPresenters(message: any): void {
    const data = JSON.stringify(message);
    this.sessions.forEach((session, ws) => {
      if (session.role === 'presenter') {
        try {
          ws.send(data);
        } catch (error) {
          this.sessions.delete(ws);
        }
      }
    });
  }

  private broadcastParticipantCount(): void {
    this.broadcast({
      type: 'participants',
      count: this.participants.size,
    });
  }
}
