# The Contextual Gateway Strategy

## The Problem: The "Lingo" Barrier

Standard analytics tools fail in specialized industries because they speak the wrong language.

- A farmer does not care about "JSON Payloads" or "IoT Heartbeats." They care about **"Water Levels"** and **"Gate Status."**
- A lawyer does not care about "Access Logs" or "User Sessions." They care about **"Chain of Custody"** and **"Case Files."**

When you force a non-technical user to translate "Tech Lingo" into their "Domain Lingo" in their head, you create friction and reduce trust.

## The Solution: Polymorphic UI

EdgeKite is built as a **Contextual Gateway**. The underlying technology (events, timestamps, source IDs) is universal, but the **Presentation Layer** is fluid.

We use a rigorous **Theming System** that goes beyond colors. It changes the entire vocabulary of the application.

### 1. The Theme Modes

| Theme | Industry | Vocabulary | Key Visuals |
|-------|----------|------------|-------------|
| **Edge** (Default) | Web / DevOps | Sources, Traffic, Visitors | Blue/Slate, Modern Sans |
| **Ranch** | Agritech / Field Ops | Assets, Livestock, Water, Weather | Earth/Green, Serif (Rustic) |
| **Legal** | Compliance / Defense | Custodians, Evidence, Access | Gold/Mahogany, Serif (Elegant) |

### 2. Implementation

We achieve this via two mechanisms:

#### A. CSS Variable System
Defined in `index.html`. We switch the entire color palette and font stack by applying a class (`.theme-ranch`) to the root container.

```css
/* Example: Ranch Theme */
.theme-ranch {
  --app-base: #292524; /* Stone 800 */
  --app-primary: #65a30d; /* Lime 600 */
  --font-heading: 'Bitter', serif;
}
```

#### B. Contextual Mock Data (The "Lingo Engine")
In `mock-data.ts`, we maintain dictionaries for event types and details mapped to themes.

```typescript
const THEMED_EVENT_TYPES = {
  ranch: {
    iot: ['gate_ajar', 'water_level_low', 'electric_fence_pulse'],
    // ...
  },
  legal: {
    iot: ['evidence_locker_access', 'printer_secure_job'],
    // ...
  }
};
```

## Strategic Value

By decoupling the "Core Tech" from the "Domain UX," EdgeKite can capture multiple vertical markets with a single codebase. We are effectively selling **"Specialized Software"** at the cost of **"Generic Software."**