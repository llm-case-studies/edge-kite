# Investment Memorandum: EdgeKite

## 1. Executive Recommendation

This document provides a comprehensive analysis of EdgeKite, an offline-first analytics platform, to assess its viability for a seed-stage investment.

**Recommendation: We recommend a seed investment in EdgeKite.**

Our thesis is that EdgeKite's strategic pivot away from the saturated web analytics market and into the "blue ocean" of lightweight industrial and field observability is a high-conviction opportunity. The platform is precisely engineered to capture a **"missing middle"** between overly complex enterprise IoT stacks and overly simplistic logging tools.

## 2. The Market Opportunity: The "Missing Middle"

A successful venture investment is predicated on identifying a genuine market gap that is both significant and underserved. The current analytics and observability landscape is bifurcated:

*   **"Too Heavy":** Enterprise IoT stacks like AWS Greengrass and Azure IoT Edge require 500MB+ of RAM, demand complex container orchestration, and assume constant cloud connectivity.
*   **"Too Simple":** Raw logs or CSV files lack synchronization, visualization, and real-time alerting.

EdgeKite is positioned to capture this "missing middle" by combining the user experience of a modern web analytics dashboard with the resilience and low resource footprint required for edge environments.

## 3. The Solution: Tiered Analytics & Privacy Airlock

EdgeKite's core value proposition is realized through two elegant architectural principles:

### A. Tiered Analytics
*   **Edge Node ("Operational Truth"):** The agent running on-site provides a fast, raw, and immediate operational view. Data retention is bounded. It works offline.
*   **Central Hub ("Analytical Truth"):** The Hub provides a corrected, enriched, and complete analytical view of data aggregated from the entire fleet.

### B. The Privacy Airlock
For high-compliance sectors (Legal, Healthcare, Defense), EdgeKite introduces the **Privacy Airlock**. This feature allows operators to leverage Cloud AI (for pattern recognition and threat analysis) **without compromising data sovereignty**.
*   Raw data never leaves the local device.
*   Data is "scrubbed" of PII via regex and heuristics locally.
*   Only anonymized patterns are sent to the cloud for analysis.

## 4. Technical Architecture & Product Viability

*   **Edge Agent:** Rust + SQLite ("Litestack"). <100MB RAM. Single-binary. Crash-safe (WAL mode).
*   **Hub & Sync:** Robust "Transactional Outbox" pattern. Events written locally (synced=0), batched, sent, then marked synced.
*   **Telemetry:** "Collect Everything" capability captures hardware, network, and performance metrics, turning every browser into a high-fidelity probe.

## 5. Monetization Strategy

*   **Edge Node (Open Source):** MIT License. Ubiquity drives the funnel.
*   **Hub (SaaS):** "Connect 5 nodes free, then $X/node/month."
*   **Appliance Model:** Pre-flashed hardware (e.g., Pi Zero) for non-technical users in Agritech.
*   **MSP License:** White-label hub for compliance agencies.

## 6. Conclusion

EdgeKite has identified a massive, underserved market and has the technical architecture to win it. The "Contextual Gateway" strategy allows it to penetrate high-value verticals (Agritech, Legal) that generic tools ignore, while the "Privacy Airlock" provides a defensive moat in regulated industries.