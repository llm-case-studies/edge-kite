# EdgeKite Content Creation

This folder contains materials for creating marketing content using Google NotebookLM and other AI tools.

## Workflow

### 1. Upload to NotebookLM

Go to [notebooklm.google.com](https://notebooklm.google.com) and create a new notebook.

Upload all files from `notebooklm-sources/`:
- `01-README.md` - Project overview and use cases
- `02-RFC-001.md` - Origin story, the "events are events" question
- `03-SYNTHESIS.md` - AI feedback synthesis, key insights
- `04-ARCHITECTURE.md` - Technical architecture
- `05-Strategic-Viability.md` - Market positioning

### 2. Generate Content

Use NotebookLM's features:
- **Audio Overview** - Podcast-style discussion
- **Study Guide** - Key points summary
- **Briefing Doc** - Executive summary
- **Timeline** - Project evolution
- **FAQ** - Common questions

For custom content, prompt NotebookLM with specific requests (see below).

### 3. Download Results

Save generated content to `notebooklm-outputs/` with descriptive names:
```
notebooklm-outputs/
├── audio-overview-2026-01-03.mp3
├── briefing-doc-2026-01-03.md
├── video-script-farmer-story.md
├── infographic-edge-vs-hub.png
└── ...
```

### 4. Review and Iterate

Review outputs, request corrections in NotebookLM, and save final versions.

---

## Suggested Prompts for NotebookLM

### Short Video Scripts (30-60 sec)

```
Create a 30-second video script about EdgeKite for developers.
Focus on the "farmer checking barn cameras on phone" use case.
Make it engaging for YouTube Shorts / Instagram Reels.
Include: hook, problem, solution, call-to-action.
```

```
Create a 45-second video script about how we designed EdgeKite with 5 different AIs.
Highlight the journey from confusion ("events are events?") to clarity.
Target audience: tech-curious developers and self-hosters.
```

```
Create a 30-second explainer about "offline-first analytics".
Use the maritime/ship scenario as the example.
End with "EdgeKite - analytics that work when the cloud doesn't."
```

### Podcast/Audio Scripts (2-5 min)

```
Create a 3-minute podcast script discussing the "missing middle" in analytics tools.
Compare enterprise IoT stacks (heavy) vs raw logs (too simple).
Position EdgeKite as the solution for self-hosters and edge deployments.
```

```
Create a 2-minute audio explainer of the EdgeKite architecture.
Explain edge nodes, SQLite, sync-when-connected, and the hub.
Use simple analogies (kite on a string, etc).
```

### Social Media Posts

```
Write 5 tweet-length posts (280 chars) about EdgeKite.
Focus on: offline-first, lightweight, privacy, self-hosting, farm/IoT use case.
Include relevant hashtags.
```

```
Write a LinkedIn post (300 words) announcing EdgeKite.
Professional tone, highlight the problem/solution and invite beta testers.
```

### Infographic Descriptions

```
Describe an infographic showing the EdgeKite data flow:
Browser/Camera/Sensor → Edge Agent → SQLite → Sync → Hub → Dashboard
Include icons and brief labels for each step.
```

```
Describe a comparison infographic:
EdgeKite vs Google Analytics vs Umami vs AWS IoT Greengrass
Compare: RAM usage, offline support, privacy, self-host ability, cost.
```

---

## Content Themes

1. **The Farmer's Dashboard** - On-My-Watch use case, barn cameras, local WiFi
2. **Events Are Events** - The unifying insight, RFC journey
3. **The Missing Middle** - Gap between enterprise and hobbyist tools
4. **Offline-First** - Resilience for maritime, rural, air-gapped
5. **Built with 5 AIs** - Collaborative AI design process
6. **Privacy by Design** - No cookies, no cloud required, own your data

---

## Where to Use Content

- **YouTube Shorts** - 30-60 sec vertical videos
- **Instagram/TikTok Reels** - Same, cross-post
- **Twitter/X** - Threads, clips
- **LinkedIn** - Professional announcements
- **Dev.to / Hashnode** - Technical blog posts
- **edge-kite.com** - Embedded on landing page
- **GitHub README** - Link to videos/demos

---

## File Naming Convention

```
{type}-{topic}-{date}.{ext}

Examples:
- video-script-farmer-story-2026-01-03.md
- audio-overview-2026-01-03.mp3
- infographic-data-flow-2026-01-03.png
- social-tweets-launch-2026-01-03.md
```
