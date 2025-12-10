# CoddleAI -- Sleep Pattern Learner & Smart Schedule (Local Coach)

CoddleAI is a **React Native** mobile application that helps
parents log baby sleep, analyze patterns locally, and generate adaptive
nap/bedtime schedules.

## Installation

### Requirements

-   Node 18+
-   npm
-   Expo Go

### Install

``` sh
npm install
```

### Running the App


``` sh
npx expo start
```

Scan QR with Expo Go.

## Architecture Overview

1.  Sleep sessions → SQLite
2.  Learner pipeline → EWMA of naps & wake windows
3.  Schedule generator → blocks (nap, wind-down, bedtime)
4.  Notification scheduler → logged
5.  Coach → rule-based insights

## Learner & Scheduling Logic

### Baseline Table (Age-Based Defaults)

| Age (months) | Nap Length    | Wake Window    |
|--------------|---------------|----------------|
| 0-2          | ~60 min       | 45-60 min      |
| 3-5          | 60-90 min     | 90-120 min     |
| 6-8          | ~90 min       | 120-150 min    |
| 9-12         | 90-120 min    | 150-180 min    |


### EWMA Parameters

-   Nap length `alpha = 0.30`
-   Wake window `alpha = 0.35`

## Coach Rules

-   Short naps (<70% target)
-   Long naps (>130% target)
-   Wake windows too long or too short
-   Cluster of short naps
-   High variability
-   Not enough data
-   All-good reassurance message

## Known Trade-offs

-   No persisted learner state
-   Simplified DST
-   Small in-memory views
-   Expo Go notification limitations

## Future Improvements

-   Persisted learner state
-   Baseline-vs-learned charts
-   More coach rules
-   More notification toggles
