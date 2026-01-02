# Edge-Hub Analytics

Exploration of a unified event collection architecture for web analytics and IoT/edge events.

## Context

This project emerged from a discussion about:
- Setting up analytics for On-My-Watch (farm/ranch security with edge NVRs)
- Questioning whether web analytics and IoT events need separate systems
- Exploring edge-first, offline-capable architectures

## Documents

- [RFC-001: Unified Event Architecture](./RFC-001-UNIFIED-EVENT-ARCHITECTURE.md) - Main discussion document seeking feedback

## Core Question

> "Events are events. Whether from a browser or a camera, they can all be reported over HTTP endpoints. Why do we treat them as fundamentally different problems?"

## How to Contribute

Review the RFC and add your perspective:
1. Create a response file: `RFC-001-RESPONSE-{your-name}.md`
2. Or add comments directly to the RFC document
3. Be direct - disagreement is valuable

## Related Projects

- [On-My-Watch](../on-my-watch) - Edge NVR + ML for farm security (if exists)
- [ionos-2c4g-production](../ionos-2c4g-production) - VPS infrastructure where Umami currently runs
