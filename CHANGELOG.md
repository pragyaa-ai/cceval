# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2024-12-26

### Added
- **Multi-Tenant Architecture**: Support for multiple organizations with segregated data
  - Organization model with branding (logo, colors)
  - Users belong to organizations with role-based access
  - Organization-specific calibration settings
  - Data isolation between organizations based on login

- **Custom Evaluation Scenarios**: Create and manage custom evaluation scenarios
  - New "Scenarios" tab in Evaluator Dashboard
  - Scenario builder with name, description, industry, and role type
  - Support for draft, active, and archived scenario statuses
  - Default scenario per organization

- **AI-Powered Criteria Suggestions**: Intelligent evaluation criteria generation
  - Paste sample call transcripts for AI analysis
  - GPT-4 powered criteria extraction
  - Suggested criteria with descriptions and scoring guidance
  - One-click addition to scenario

- **Custom Scoring Criteria**: Define organization-specific evaluation metrics
  - Create custom criteria with parameter ID, label, and description
  - Category-based organization (voice_quality, communication, domain_knowledge, etc.)
  - Weighted scoring support
  - Score examples for AI guidance

- **Custom Reading Passages**: Domain-specific voice assessment content
  - Create industry-relevant reading passages
  - Difficulty levels (easy, medium, hard)
  - Context descriptions for relevance

- **Custom Role-Play Scenarios**: Define realistic customer interactions
  - Multiple difficulty levels (beginner, moderate, experienced)
  - Customer personas with mood and personality
  - Opening lines and escalation triggers
  - Expected behaviors for scoring

- **Sample Recording Analysis**: AI analysis of sample calls
  - Upload sample recordings for analysis
  - Automatic transcript generation
  - AI-suggested criteria based on real calls
  - Quality labeling (good, average, poor)

- **Batch Scenario Selection**: Link batches to custom scenarios
  - Select evaluation scenario when creating batches
  - Auto-populate default organization scenario
  - Scenario criteria used for evaluations

### Changed
- **Database Schema**: Major updates for multi-tenancy and scenarios
  - Added Organization, EvaluationScenario, ScoringCriteria models
  - Added ReadingPassage, RolePlayScenario, SampleRecording models
  - Added OrganizationCalibration for org-level calibration
  - Updated User, Batch models with organization relationships

- **Authentication**: Enhanced session with organization context
  - Session includes organizationId and organization details
  - Organization-scoped API access

- **API Routes**: New scenario management endpoints
  - `/api/v2/organizations` - Organization management
  - `/api/v2/scenarios` - Scenario CRUD operations
  - `/api/v2/scenarios/[id]/criteria` - Criteria management
  - `/api/v2/scenarios/[id]/analyze-recording` - AI analysis
  - `/api/v2/scenarios/[id]/generate-instructions` - Agent prompt generation

### Technical
- Full TypeScript support for all new models
- Prisma migrations for new schema
- Organization-level data isolation
- AI integration with GPT-4o for analysis

---

## [2.0.0] - 2024-12-19

### Added
- **17 Comprehensive Data Points**: Expanded data collection from 8 to 17 store verification points
  - Store ID/Code, Address Line 1, Locality, Landmark, City, State, PIN Code
  - Business Hours, Weekly Off
  - Main Phone Number with STD, Store Manager's Number, Alternate Number  
  - Store Email ID, Store Manager's Email ID, Designation of Person
  - Parking Options, Payment Methods Accepted

- **Mandatory Confirmation Protocol**: 3-step verification process
  - Immediate data capture using `capture_store_data` tool
  - Immediate read-back confirmation to customer
  - Wait for explicit confirmation before proceeding

- **Smart Escalation System**: Prevents infinite loops on difficult data points
  - Maximum 2 attempts per data point
  - Auto-escalation to human expert after 2 failed attempts
  - Continues conversation flow instead of getting stuck

- **Enhanced UI Components**:
  - Updated AgentVisualizer with 17 data point display
  - Appropriate icons for each data type
  - Real-time progress tracking
  - Updated demo buttons for testing

### Changed
- **DataCollectionContext**: Updated to handle 17 new data points
- **Agent Tools**: Enhanced `capture_store_data` and `verify_captured_data` with new data types
- **Agent Instructions**: Comprehensive confirmation and escalation protocols
- **UI Layout**: Professional data collection center with progress indicators

### Improved
- **Data Accuracy**: Confirmation protocol ensures 100% accurate captures
- **Conversation Flow**: Escalation system prevents agent from getting stuck
- **User Experience**: Smooth flow with expert fallback for complex cases
- **Business Value**: Complete store verification data for operations

### Technical
- Full TypeScript support for new data structure
- Backward compatibility maintained
- Enhanced error handling and validation
- Optimized state management for 17 data points

## [1.x.x] - Previous Versions

### Features
- Basic 8 data point collection system
- Simple capture functionality  
- Basic UI interface
- Core agent infrastructure 