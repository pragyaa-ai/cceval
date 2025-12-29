# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-12-29

### Added

- **AceEval for Acengage**: Specialized evaluation platform for HR services
  - Exit Interview evaluations
  - New Hire Engagement (NHE) evaluations
  - Continuous Engagement (CE) evaluations

- **Use Case Selection per Candidate**: Each candidate can be assigned a specific use case
  - Exits: Employee retention and exit interview assessments
  - NHE: New hire onboarding and integration assessments
  - CE: Continuous employee engagement assessments

- **HR-Focused Reading Passages**:
  - Exit Interview passages (Employee Retention, Constructive Feedback)
  - NHE passages (Onboarding Experience, Team Integration)
  - CE passages (Employee Satisfaction, Career Development)

- **HR-Specific Call Scenarios**:
  - Exit scenarios (Reluctant Exit, Frustrated Exit, Opportunity Exit)
  - NHE scenarios (Struggling New Hire, Disengaged New Hire, Positive Check-in)
  - CE scenarios (Employee with Concerns, High Attrition Risk, Routine Check-in)

- **Use Case Specific Scoring Parameters**:
  - **Exits** (7 metrics): Enthusiasm, Listening, Language, Probing, Convincing, Start of Conversation, End of Conversation
  - **NHE** (7 metrics): Enthusiasm, Tone & Language, Listening, Start of Conversation, End of Conversation, Probing to Identify Dissatisfaction, Convincing Skills
  - **CE** (11 metrics): Opening, Selling Client Benefits, Objection Handling, Probing, Taking Feedback, Solving Queries, Conversational Skills, Taking Ownership, Enthusiasm, Reference of Previous Call, Closing

- **Acengage Evaluation Agent**: Specialized AI agent for HR services evaluations
  - Employee role-play scenarios
  - HR-focused personal questions
  - Use case aware empathy challenges

### Changed

- **Branding**: Complete rebranding from CCEval to AceEval
  - Updated landing page with AceEval branding
  - Orange/Amber color scheme
  - Acengage-focused messaging

- **Evaluator Dashboard**: Enhanced with use case support
  - Use Case column in candidates table
  - Dynamic reading passage options based on use case
  - Dynamic call scenario options based on use case

- **V2EvaluationContext**: Major updates for use case support
  - `UseCase` type (exits | nhe | ce)
  - `SCORING_PARAMETERS_BY_USE_CASE` for use case specific metrics
  - `getReadingPassages()` - Filter passages by use case
  - `getCallScenarios()` - Filter scenarios by use case
  - `getScoringParameters()` - Get metrics for use case

### Technical

- Based on CCEval v2.0 architecture
- Full use case segregation at candidate level
- Voice analysis integration retained
- Calibration system adapted for HR metrics

---

## Based on CCEval v2.0

This version is a specialized fork of CCEval for Acengage HR services.
For original CCEval changelog, see the main branch.
