# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-01-09

### Added

- **Continuous Learner Portal**: Gamified training platform for call center agents
  - Practice mock sessions with AI-powered feedback
  - Points and XP system for completed activities
  - Level progression (Novice → Expert → Legend)
  - Achievement badges and milestones
  - Redeemable rewards catalog
  - Use case-specific training modules (PV Sales, EV Sales, Service)

- **Scenarios Configuration UI**: Complete management interface for evaluation content
  - **Use Cases Management**: Create, edit, and toggle active use cases
    - PV Sales: Passenger vehicle sales inquiries
    - EV Sales: Electric vehicle sales and education
    - Service Support: Service booking and complaints
  - **Reading Passages**: Configure reading comprehension texts per use case
  - **Call Scenarios**: Manage role-play scenarios with difficulty levels
  - **Scoring Metrics**: Use case-specific evaluation criteria
  - **Voice Quality Metrics**: Configure voice analysis parameters and thresholds

- **Use Case Support**: Per-candidate use case assignment
  - Use Case column in Candidate Management
  - Use Case, Reading Passage, and Scenario columns in Results tab
  - Dynamic scoring parameters based on use case
  - Use case-specific reading passages and call scenarios

### Changed

- **Results Tab**: Enhanced to show separate columns for Use Case, Reading Passage, and Scenario
- **Landing Page**: Three-column layout with Evaluator, Candidate, and Continuous Learner cards
- **V2EvaluationContext**: Extended with use case types and helper functions
  - `UseCase` type (pv_sales | ev_sales | service)
  - `USE_CASE_LABELS` for display names
  - `SCORING_PARAMETERS_BY_USE_CASE` for use case-specific metrics
  - `getReadingPassages()`, `getCallScenarios()`, `getScoringParameters()` helpers

### Technical

- New `/v2/learner` route for Continuous Learner portal
- Added Scenarios tab to Evaluator Dashboard
- Extended CandidateInfo interface with `useCase` field
- Backward compatible with existing evaluations

---

## [2.0.0] - 2024-12-16

### Added

- **Version 2.0 Architecture**: Complete redesign with improved evaluation flow
- **Batch Management**: Create and manage evaluation batches
- **Access Codes**: 4-digit unique codes for candidate authentication
- **AI Voice Agent**: Real-time voice-based evaluation using OpenAI Realtime API
- **Reading Assessment**: Configurable reading passages for voice quality evaluation
- **Call Scenarios**: Multiple difficulty levels (Beginner, Moderate, Experienced)
- **Live Voice Analysis**: Real-time metrics (clarity, volume, pace, tone)
- **Manager Feedback**: Post-evaluation manager review workflow
- **HR Decision**: Final hiring decision tracking
- **Calibration System**: AI-powered score calibration based on evaluator feedback
- **Export Results**: CSV, Excel, and JSON export options

### Technical

- Next.js 14 with App Router
- Prisma ORM with PostgreSQL
- NextAuth.js for Google OAuth
- OpenAI Realtime API for voice interactions
- Real-time WebSocket audio streaming

---

## [1.0.0] - 2024-11-01

### Added

- Initial release with basic evaluation functionality
- Simple candidate management
- Score tracking and reporting
