# Slidev Feedback Skill - Examples

## Table of Contents
1. [Basic Setup](#basic-setup)
2. [Workshop Configuration](#workshop-configuration)
3. [Conference Talk Setup](#conference-talk-setup)
4. [Educational Lecture](#educational-lecture)
5. [Advanced Configurations](#advanced-configurations)
6. [API Examples](#api-examples)

## Basic Setup

### Creating Your First Feedback Session

```typescript
// Using the Amagen Dashboard
const session = await createFeedbackSession({
  presentationTitle: "Introduction to React Hooks",
  slideCount: 25,
  allowedReactions: ["👍", "❤️", "🤔", "💡", "👏"],
  enableQuestions: true,
  requireAuth: false,
  theme: "auto"
});

console.log(`Widget URL: ${session.widgetUrl}`);
console.log(`QR Code: ${session.qrCode}`);
```

### Embedding in Slidev

Add to individual slides in `slides.md`:

```markdown
---
layout: default
---

# Understanding useState

The most fundamental React Hook for state management.

<iframe 
  src="https://widgets.amagen.app/widget/YOUR_SESSION_ID?slide=5" 
  width="100%" 
  height="120px" 
  frameborder="0"
  style="margin-top: 20px;">
</iframe>
```

### Global Widget Setup

Create `components/GlobalFeedback.vue`:

```vue
<template>
  <Transition name="slide-fade">
    <div 
      v-if="showWidget" 
      class="feedback-container"
      :class="{ 'feedback-minimized': isMinimized }"
    >
      <button 
        @click="isMinimized = !isMinimized"
        class="minimize-btn"
      >
        {{ isMinimized ? '📊' : '—' }}
      </button>
      <iframe 
        v-show="!isMinimized"
        :src="widgetUrl"
        width="100%" 
        height="120px" 
        frameborder="0"
      />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSlidevContext } from '@slidev/client'

const { $slidev } = useSlidevContext()
const sessionId = 'YOUR_SESSION_ID'
const showWidget = ref(true)
const isMinimized = ref(false)

const widgetUrl = computed(() => 
  `https://widgets.amagen.app/widget/${sessionId}?slide=${$slidev.nav.currentPage}`
)
</script>

<style>
.feedback-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  z-index: 1000;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.feedback-minimized {
  width: 60px;
  height: 60px;
}

.minimize-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 20px;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
```

## Workshop Configuration

### Interactive Workshop with Q&A Focus

```typescript
const workshopSession = await createFeedbackSession({
  presentationTitle: "Agile Transformation Workshop",
  slideCount: 40,
  allowedReactions: ["✅", "❓", "💡", "🎯", "👏"],
  enableQuestions: true,
  requireAuth: false,
  moderateQuestions: false, // Show questions immediately
  sessionDuration: 4, // 4-hour workshop
  theme: "light"
});
```

### Presenter Notes Integration

Add to your slide notes for quick access:

```markdown
---
layout: two-cols
---

# Sprint Planning Best Practices

::left::

- Timeboxed to 2 hours per sprint week
- Whole team participates
- Product Owner presents prioritized backlog

::right::

<img src="/planning.png" />

<!-- 
Presenter Dashboard: https://app.amagen.com/skills/slidev-feedback/dashboard/SESSION_ID

Key Points to Cover:
1. Emphasize collaboration
2. Check audience understanding via reactions
3. Address questions before moving on

Expected Questions:
- How to handle dependencies?
- What about technical debt?
-->
```

## Conference Talk Setup

### Large Audience Configuration

```typescript
const conferenceSession = await createFeedbackSession({
  presentationTitle: "The Future of Web Development",
  slideCount: 60,
  allowedReactions: ["❤️", "🔥", "🚀", "🤯", "👏"],
  enableQuestions: false, // Disable for large audiences
  requireAuth: false,
  theme: "dark"
});
```

### Display QR Code on Title Slide

```markdown
---
layout: intro
class: text-center
---

# The Future of Web Development

## Real-time Feedback Available!

<div class="qr-container">
  <img src="QR_CODE_URL" alt="Scan for feedback" />
  <p>Scan to react in real-time!</p>
</div>

<style>
.qr-container {
  margin-top: 40px;
}
.qr-container img {
  width: 200px;
  height: 200px;
  margin: 0 auto;
}
</style>
```

## Educational Lecture

### Student Engagement Configuration

```typescript
const lectureSession = await createFeedbackSession({
  presentationTitle: "Data Structures & Algorithms",
  slideCount: 50,
  allowedReactions: ["🎯", "💡", "❓", "✅", "⭐"],
  enableQuestions: true,
  requireAuth: true, // Students must sign in
  moderateQuestions: true, // Review before display
  theme: "auto"
});
```

### Understanding Checks

Use specific slides for comprehension checks:

```markdown
---
layout: center
---

# Quick Check: Binary Search Complexity

What's the time complexity of binary search?

<div class="poll-container">
  <iframe 
    src="https://widgets.amagen.app/widget/SESSION_ID?slide=15&mode=poll" 
    width="600px" 
    height="400px" 
    frameborder="0">
  </iframe>
</div>

<!-- 
Wait for responses before revealing answer
Target: 80% correct responses
If <80%, review the concept
-->
```

## Advanced Configurations

### Custom Reaction Sets

```typescript
// Emoji sets for different contexts
const reactionSets = {
  technical: ["🐛", "✨", "🔧", "⚡", "🎯"],
  creative: ["🎨", "✏️", "🌈", "💫", "🎭"],
  business: ["📈", "💼", "🎯", "💡", "✅"],
  fun: ["😂", "🎉", "🦄", "🌟", "🚀"]
};

const customSession = await createFeedbackSession({
  presentationTitle: "Creative Coding Workshop",
  slideCount: 30,
  allowedReactions: reactionSets.creative,
  enableQuestions: true,
  theme: "dark"
});
```

### Multi-language Support

```typescript
// Configure for international audience
const internationalSession = await createFeedbackSession({
  presentationTitle: "Global Product Launch",
  slideCount: 35,
  allowedReactions: ["👍", "👎", "❓", "💡", "⭐"], // Universal emojis
  enableQuestions: true,
  moderateQuestions: true, // For translation if needed
  theme: "auto"
});
```

### Timed Sessions

```typescript
// Auto-close after presentation
const timedSession = await createFeedbackSession({
  presentationTitle: "Lunch & Learn: Docker Basics",
  slideCount: 20,
  allowedReactions: ["👍", "👎", "❓", "💡", "🍕"],
  enableQuestions: true,
  sessionDuration: 1, // Auto-close after 1 hour
  theme: "light"
});
```

## API Examples

### Creating a Session Programmatically

```typescript
// Using fetch API
const response = await fetch('https://api.amagen.app/skills/slidev-feedback/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_TOKEN}`
  },
  body: JSON.stringify({
    presentationTitle: "API Integration Demo",
    slideCount: 15,
    allowedReactions: ["👍", "👎", "❓"],
    enableQuestions: false
  })
});

const session = await response.json();
```

### Fetching Analytics

```typescript
// Get session analytics
const analytics = await fetch(
  `https://api.amagen.app/skills/slidev-feedback/analytics/${sessionId}`,
  {
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`
    }
  }
).then(res => res.json());

console.log(`Total Reactions: ${analytics.totalReactions}`);
console.log(`Peak Engagement: Slide ${analytics.peakEngagementSlide}`);
console.log(`Top Reactions:`, analytics.topReactions);
```

### Exporting Data

```typescript
// Export feedback data
const exportData = await fetch(
  `https://api.amagen.app/skills/slidev-feedback/export/${sessionId}`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`
    },
    body: JSON.stringify({
      format: 'csv',
      includeReactions: true,
      includeQuestions: true,
      includeAnalytics: true,
      groupBySlide: true
    })
  }
).then(res => res.blob());

// Download the file
const url = window.URL.createObjectURL(exportData);
const a = document.createElement('a');
a.href = url;
a.download = `feedback-${sessionId}.csv`;
a.click();
```

### Real-time Updates via WebSocket

```typescript
// Connect to live updates
const ws = new WebSocket(`wss://widgets.amagen.app/feedback/${durableObjectId}`);

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'join',
    role: 'observer',
    sessionToken: 'observer-token'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'reaction':
      console.log(`New reaction: ${data.emoji} on slide ${data.slide}`);
      break;
    case 'question':
      console.log(`New question: ${data.text}`);
      break;
    case 'participants':
      console.log(`Active participants: ${data.count}`);
      break;
  }
};
```

### Custom Widget Styling

```html
<!-- Embed with custom styling -->
<div class="custom-feedback-wrapper">
  <iframe 
    id="feedback-widget"
    src="https://widgets.amagen.app/widget/SESSION_ID" 
    width="100%" 
    height="150px" 
    frameborder="0">
  </iframe>
</div>

<style>
.custom-feedback-wrapper {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 600px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 10px;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
}

.custom-feedback-wrapper iframe {
  border-radius: 10px;
}
</style>
```

## Best Practices

1. **Test Before Presentation**: Always create and test your session before the actual presentation
2. **Monitor Dashboard**: Keep the presenter dashboard open on a second screen
3. **Engagement Prompts**: Remind audience to use reactions at key moments
4. **Question Timing**: Dedicate specific slides for Q&A sessions
5. **Export Data**: Export feedback data immediately after the session for analysis

## Troubleshooting

### Widget Not Loading
```javascript
// Check connection and retry
function loadWidget(retries = 3) {
  const iframe = document.getElementById('feedback-widget');
  
  iframe.onerror = () => {
    if (retries > 0) {
      setTimeout(() => loadWidget(retries - 1), 2000);
    } else {
      console.error('Failed to load feedback widget');
    }
  };
}
```

### WebSocket Connection Issues
```javascript
// Implement reconnection logic
class FeedbackConnection {
  constructor(durableObjectId) {
    this.durableObjectId = durableObjectId;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(`wss://widgets.amagen.app/feedback/${this.durableObjectId}`);
    
    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), 1000 * Math.pow(2, this.reconnectAttempts));
      }
    };
    
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
    };
  }
}
```

## Support

For more examples and support:
- GitHub Issues: https://github.com/YOUR_USERNAME/slidev-feedback-skill/issues
- Amagen Discord: https://discord.gg/amagen
- Documentation: https://docs.amagen.com/skills/slidev-feedback
