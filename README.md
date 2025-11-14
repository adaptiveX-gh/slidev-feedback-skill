# Slidev Real-time Feedback Skill

Enable live audience reactions and feedback during Slidev presentations with WebSocket-powered real-time updates.

## Features

- 📊 **Real-time Reactions** - Instant audience feedback with emoji reactions
- 🔄 **Live Updates** - WebSocket-based communication for zero-latency updates
- 📈 **Analytics Dashboard** - Track engagement metrics and reaction patterns
- 🎨 **Embeddable Widget** - Drop-in widget for any website or Slidev presentation
- 🏃 **Durable Objects** - Persistent state management with Cloudflare
- 🎯 **Slide Sync** - Automatic slide tracking and reaction mapping
- 💬 **Questions & Comments** - Collect audience questions per slide
- 📱 **Mobile Optimized** - QR code access for audience members

## Installation

### Via Amagen Dashboard

1. Navigate to **My Skills** > **Add Skill**
2. Select **Import from GitHub**
3. Enter repository URL: `https://github.com/YOUR_USERNAME/slidev-feedback-skill`
4. Click **Import Skill**

### Manual Installation

```bash
git clone https://github.com/YOUR_USERNAME/slidev-feedback-skill
cd slidev-feedback-skill
pnpm install
pnpm build
```

## Usage

### 1. Create Feedback Session (Dashboard)

Navigate to the skill in your Amagen dashboard and click "Create New Session". Configure:
- Presentation title
- Number of slides
- Allowed reaction types
- Authentication requirements

### 2. Embed in Slidev

Add to your `slides.md`:

```markdown
---
layout: default
---

# My Slide Title

<iframe 
  src="https://widgets.amagen.app/widget/SESSION_ID" 
  width="100%" 
  height="120px" 
  frameborder="0">
</iframe>
```

Or add globally to all slides via `setup/main.ts`:

```typescript
import { defineAppSetup } from '@slidev/types'

export default defineAppSetup(({ app }) => {
  // Add feedback widget to all slides
})
```

### 3. Monitor Reactions (Presenter View)

Access the presenter dashboard in Amagen to see:
- Real-time reactions as they happen
- Current slide indicator
- Participant count
- Question feed
- Engagement heatmap

## Configuration

### Reaction Sets

Choose from preset reaction sets or customize:

```typescript
// Professional
["👍", "👎", "❓", "💡", "✅"]

// Engaging
["❤️", "🔥", "😮", "🤔", "👏"]

// Educational
["🎯", "💡", "❓", "✅", "⭐"]
```

### Authentication Modes

- **Open**: Anyone can react (default)
- **Authenticated**: Requires Amagen login
- **Token**: Custom access tokens

### Session Settings

- **Duration**: Auto-close after N hours
- **Rate Limiting**: Max reactions per user per slide
- **Moderation**: Review questions before display

## Slidev Integration

### Global Feedback Component

Create `components/FeedbackWidget.vue`:

```vue
<template>
  <div class="feedback-widget">
    <iframe 
      :src="`https://widgets.amagen.app/widget/${sessionId}?slide=${$slidev.nav.currentPage}`"
      width="100%" 
      height="120px" 
      frameborder="0"
    />
  </div>
</template>

<script setup>
const sessionId = 'YOUR_SESSION_ID'
</script>
```

### Presenter Notes Integration

Add to presenter notes to see reactions inline:

```markdown
---
layout: default
---

# Slide Title

Content here...

<!--
Feedback Dashboard: https://app.amagen.com/skills/slidev-feedback/dashboard/SESSION_ID
-->
```

## Examples

### Workshop Feedback

Perfect for training sessions:
- Question collection per slide
- Understanding checks
- Engagement tracking

### Conference Talk

Great for large audiences:
- Quick emoji reactions
- Real-time sentiment
- Q&A collection

### Educational Lecture

Ideal for teaching:
- Comprehension ratings
- Clarification requests
- Topic interest gauge

## API

### Create Session

```typescript
POST /api/skills/slidev-feedback/create
{
  "presentationTitle": "React Best Practices",
  "slideCount": 30,
  "allowedReactions": ["👍", "❤️", "🔥", "🤔", "👏"],
  "requireAuth": false
}
```

### Submit Reaction

```typescript
POST /api/skills/slidev-feedback/react
{
  "sessionId": "xxx",
  "slideNumber": 5,
  "reaction": "👍",
  "userId": "optional"
}
```

### Get Analytics

```typescript
GET /api/skills/slidev-feedback/analytics/SESSION_ID
```

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build for production
pnpm build

# Deploy Durable Objects to Cloudflare
pnpm deploy:worker

# Run tests
pnpm test
```

## Architecture

- **Frontend**: React + TypeScript + shadcn/ui
- **Backend**: Express handlers + Cloudflare Workers
- **Real-time**: WebSockets via Durable Objects
- **Storage**: Supabase for analytics, DO for live state
- **Deployment**: Amagen platform + Cloudflare edge

## License

MIT © [Your Name]

## Support

- GitHub Issues: [Report a bug](https://github.com/YOUR_USERNAME/slidev-feedback-skill/issues)
- Amagen Community: [Discord](https://discord.gg/amagen)
- Documentation: [Full Docs](https://docs.amagen.com/skills/slidev-feedback)

## Acknowledgments

Based on the original [slidev-realtime-feedback-do](https://github.com/harshil1712/slidev-realtime-feedback-do) by Harshil Agrawal.
