# AceEval v2.0.0

**AI-Powered HR Services Candidate Evaluation Platform for Acengage**

An intelligent evaluation system that conducts comprehensive voice-based assessments of HR services candidates for Exit Interviews, New Hire Engagement (NHE), and Continuous Engagement (CE) roles. AceEval transforms traditional hiring processes by providing consistent, unbiased, and data-driven candidate evaluations.

## 🎯 What is AceEval?

AceEval is an enterprise-grade platform designed to evaluate HR services candidates through realistic simulations and voice analysis. The system conducts structured interviews, role-play scenarios, and comprehensive assessments while providing detailed performance metrics and scoring for Acengage's three core service lines.

### 🌟 Key Features

- **🤖 AI-Powered Interviews**: Intelligent agents conduct structured evaluations with natural conversation flow
- **🎤 Voice Analysis**: Real-time voice quality assessment (clarity, pace, tone, volume)
- **📊 Use Case Specific Scoring**: Tailored evaluation metrics for Exits, NHE, and CE roles
- **🎭 HR Role-Play Scenarios**: Realistic employee interaction simulations
- **🔄 Manager & HR Workflow**: Complete hiring pipeline from evaluation to final decision
- **🎯 AI Calibration System**: Learns from evaluator feedback to align with organizational standards
- **📈 Comprehensive Dashboard**: Real-time monitoring, batch management, and detailed analytics
- **🔐 Secure Authentication**: Role-based access control for evaluators and candidates

## 📋 Use Case Coverage

### Exit Interviews
Candidates handling employee exits, retention opportunities, and gathering honest feedback.

**Scoring Metrics (7):**
- Enthusiasm
- Listening
- Language
- Probing
- Convincing
- Start of Conversation
- End of Conversation

### New Hire Engagement (NHE)
Candidates conducting onboarding check-ins and new employee integration support.

**Scoring Metrics (7):**
- Enthusiasm
- Tone & Language
- Listening
- Start of Conversation
- End of Conversation
- Probing to Identify Dissatisfaction
- Convincing Skills

### Continuous Engagement (CE)
Candidates managing ongoing employee engagement and retention activities.

**Scoring Metrics (11):**
- Opening
- Selling Client Benefits
- Objection Handling
- Asking Questions/Probing
- Taking Feedback
- Solving Queries
- Conversational Skills
- Taking Ownership on the Call
- Enthusiasm
- Reference of Previous Call
- Closing

## 🤖 Evaluation Features

### Acengage Evaluation Agent
The **Eva 2.0** agent conducts comprehensive assessments through six structured phases:

#### Evaluation Flow
1. **Welcome & Candidate Information**: Professional greeting and candidate data collection
2. **Personal Questions**: Background, motivation, and HR domain knowledge assessment
3. **Reading Task**: Voice quality baseline with automated voice analysis
4. **Employee Scenario Simulation**: Use case specific role-play scenarios
5. **Empathy & De-escalation**: High-pressure situation handling
6. **Closure Task**: Professional call closure quality assessment

### HR-Focused Reading Passages
- **Exit Interviews**: Employee Retention, Constructive Feedback
- **NHE**: Onboarding Experience, Team Integration
- **CE**: Employee Satisfaction, Career Development

### HR Call Scenarios
- **Exit Scenarios**: Reluctant Exit, Frustrated Exit, Opportunity Exit
- **NHE Scenarios**: Struggling New Hire, Disengaged New Hire, Positive Check-in
- **CE Scenarios**: Employee with Concerns, High Attrition Risk, Routine Check-in

### Voice Analysis Engine
Real-time audio processing provides:
- **Clarity Score**: Speech intelligibility and articulation
- **Volume Analysis**: Consistent projection and audibility
- **Tone Assessment**: Professional and appropriate tonality
- **Pace Measurement**: Speaking speed and rhythm
- **Sample Collection**: Continuous voice quality monitoring

## 📊 Dashboard Capabilities

### Evaluator Dashboard
- **Batch Management**: Create and manage evaluation batches
- **Use Case Selection**: Assign Exits, NHE, or CE use case per candidate
- **Candidate Tracking**: Monitor evaluation progress and status
- **Real-time Evaluation**: Live candidate assessment interface
- **Score Review**: Detailed performance breakdowns with AI-generated reasons
- **Manager Feedback**: Provide hiring recommendations
- **HR Decision**: Final hiring decisions with feedback
- **Audio Playback**: Review complete evaluation recordings
- **Transcript Access**: Full conversation transcripts with Q&A format
- **Calibration System**: AI learning from evaluator feedback

### Candidate Portal
- **Secure Access**: Unique evaluation codes for each candidate
- **Voice Evaluation**: Seamless audio interface for assessments
- **Progress Tracking**: Real-time evaluation phase indicators
- **Professional Experience**: Clean, focused evaluation interface

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- OpenAI API key with Realtime API access

### Quick Start
```bash
# Clone the repository
git clone https://github.com/pragyaa-ai/aceeval.git
cd aceeval

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and API credentials

# Set up database
npx prisma db push
npx prisma generate

# Build for production
npm run build

# Start the application
npm start
```

### Environment Variables
```env
DATABASE_URL="postgresql://user:password@localhost:5432/aceeval"
NEXTAUTH_URL="https://aceeval.pragyaa.ai"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
OPENAI_API_KEY="sk-your-openai-key"
```

## 🏗️ Technical Architecture

- **Frontend**: Next.js 14 with React 18, Tailwind CSS
- **Backend**: Next.js API Routes with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI Engine**: OpenAI GPT-4o + Realtime API
- **Authentication**: NextAuth.js with Google OAuth
- **Voice Processing**: OpenAI Whisper + custom analysis

## 📝 Version History

### v2.0.0 (Current)
- AceEval for Acengage with Exit, NHE, and CE use cases
- Use case selection per candidate
- HR-focused reading passages and scenarios
- Use case specific scoring parameters

## 🗺️ Roadmap

- [ ] Multi-language support (Hindi, regional languages)
- [ ] Advanced analytics dashboard
- [ ] Batch upload for candidates
- [ ] Integration with Acengage CRM
- [ ] Custom scenario builder

---

**Built with ❤️ by Pragyaa.ai for Acengage**

© 2025 Pragyaa.ai. All rights reserved.
