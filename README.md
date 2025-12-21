# CCEval v2.0.0

**AI-Powered Call Center Candidate Evaluation Platform**

An intelligent evaluation system that conducts comprehensive voice-based assessments of call center candidates using advanced AI agents. CCEval transforms traditional hiring processes by providing consistent, unbiased, and data-driven candidate evaluations.

## 🎯 What is CCEval?

CCEval is an enterprise-grade platform designed to evaluate call center candidates through realistic simulations and voice analysis. The system conducts structured interviews, role-play scenarios, and comprehensive assessments while providing detailed performance metrics and scoring.

### 🌟 Key Features

- **🤖 AI-Powered Interviews**: Intelligent agents conduct structured evaluations with natural conversation flow
- **🎤 Voice Analysis**: Real-time voice quality assessment (clarity, pace, tone, volume)
- **📊 Multi-Dimensional Scoring**: 8 comprehensive evaluation parameters with AI-generated justifications
- **🎭 Role-Play Scenarios**: Realistic customer interaction simulations including escalation handling
- **🔄 Manager & HR Workflow**: Complete hiring pipeline from evaluation to final decision
- **🎯 AI Calibration System**: Learns from evaluator feedback to align with organizational standards
- **📈 Comprehensive Dashboard**: Real-time monitoring, batch management, and detailed analytics
- **🔐 Secure Authentication**: Role-based access control for evaluators and candidates

## 🤖 Evaluation Features

### Mahindra HCE Evaluation Agent
The **Eva 2.0** agent conducts comprehensive assessments through six structured phases:

#### Evaluation Flow
1. **Welcome & Candidate Information**: Professional greeting and candidate data collection
2. **Personal Questions**: Background, motivation, and domain knowledge assessment
3. **Reading Task**: Voice quality baseline with automated voice analysis
4. **Call Scenario Simulation**: Product knowledge and customer service skills
5. **Empathy & De-escalation**: High-pressure situation handling
6. **Closure Task**: Professional call closure quality assessment

#### Scoring Parameters (1-5 Scale)
- **Clarity & Pace**: Speech quality, articulation, and flow
- **Product Knowledge**: Industry and product awareness
- **Empathy**: Emotional intelligence and customer understanding
- **Customer Understanding**: Active listening and needs assessment
- **Handling Pressure**: Composure under stress
- **Confidence**: Tone stability and self-assurance
- **Process Accuracy**: Lead capture and follow-up procedures
- **Closure Quality**: Professional conversation ending

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
git clone https://github.com/pragyaa-ai/cceval.git
cd cceval

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Set up the database
npx prisma migrate dev
npx prisma generate

# Start development server
npm run dev
```

### Environment Configuration
Create a `.env` file in the root directory:
```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/cceval"

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here
```

### Production Deployment
```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 🚀 Using CCEval

### For Evaluators
1. **Login**: Access the evaluator dashboard at `/v2/login`
2. **Create Batch**: Set up a new evaluation batch with candidate details
3. **Share Codes**: Distribute unique evaluation codes to candidates
4. **Monitor Progress**: Track evaluations in real-time
5. **Review Scores**: Assess AI-generated scores and transcripts
6. **Provide Feedback**: Add manager recommendations
7. **Final Decision**: HR team makes final hiring decisions

### For Candidates
1. **Access Portal**: Visit the candidate portal at `/v2/candidate`
2. **Enter Code**: Input your unique evaluation code
3. **Start Evaluation**: Click "Connect" to begin voice conversation
4. **Follow Agent**: Complete all evaluation phases
5. **Await Results**: Evaluation automatically saved and submitted

## 🎨 User Interface

### Evaluator Dashboard Components
- **Left Panel**: Batch and candidate management
- **Center Panel**: Active evaluation interface or candidate list
- **Right Panel**: Evaluation details, scores, and feedback
- **Audio Player**: Playback controls for evaluation recordings
- **Transcript Viewer**: Q&A format conversation display

### Candidate Interface
- **Clean Design**: Distraction-free evaluation experience
- **Voice Visualizer**: Real-time audio feedback
- **Progress Indicator**: Current evaluation phase tracking
- **Professional Branding**: Pragyaa.ai branded interface

## 🔧 Technical Architecture

### Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with Prisma adapter
- **AI Engine**: OpenAI Realtime API, GPT-4 for calibration
- **Audio Processing**: Web Audio API, MediaRecorder

### Agent Configuration
- **Instructions**: Comprehensive evaluation protocols and conversation flows
- **Tools**: Data capture, phase management, voice analysis
- **Context**: Real-time state management and calibration guidance
- **Personas**: Dynamic role-playing for realistic scenarios

### Data Management
- **Candidate Records**: Complete profile and evaluation history
- **Evaluation Sessions**: Detailed scoring with AI justifications
- **Audio Storage**: Secure recording management
- **Calibration Data**: Continuous learning from evaluator feedback
- **Batch Operations**: Efficient multi-candidate processing

### Integration Points
- **OpenAI Realtime API**: Powers conversational voice interface
- **Prisma ORM**: Type-safe database access
- **Next.js Framework**: Full-stack application with API routes
- **React Context**: Global state management

## 📋 Version History

### v2.0.0 (Current) - December 19, 2024
- **Manager Feedback & HR Decision Workflow**: Complete hiring pipeline
- **AI Calibration System**: Learning from evaluator feedback
- **Reprocess API**: Regenerate scores from recordings
- **Enhanced Data Collection**: Comprehensive candidate profiling
- **Improved Evaluation Flow**: Smoother phase transitions
- **Better Error Handling**: Graceful fallbacks and validation

### v1.3.0 - December 17, 2025
- **Voice Analysis**: Reliable sample collection with setInterval
- **Audio Recording**: Full recording playback and download
- **AI-Generated Reasons**: Detailed score justifications
- **Transcript Display**: Q&A format conversations
- **Voice Quality Metrics**: Clarity, volume, tone, pace analysis
- **Candidate Demographics**: Age, gender, native language detection

### v1.x.x - Previous Versions
- Basic evaluation infrastructure
- Core agent functionality
- Simple UI interface
- Initial voice integration

## 🚀 Future Roadmap

- **Advanced Analytics**: Comprehensive reporting and insights
- **Multi-Language Support**: Evaluations in multiple languages
- **Custom Scoring Templates**: Industry-specific evaluation criteria
- **Video Integration**: Visual candidate assessment capabilities
- **API Integrations**: Connect with ATS and HRMS systems
- **Mobile Application**: Native mobile apps for candidates
- **Bulk Upload**: CSV import for candidate batches
- **White-Label Solution**: Customizable branding options

## 🔒 Security & Privacy

- **Data Encryption**: All sensitive data encrypted at rest and in transit
- **Access Control**: Role-based permissions (Admin, Evaluator, HR, Candidate)
- **Secure Authentication**: Industry-standard auth with NextAuth.js
- **Audit Trails**: Complete logging of all evaluation activities
- **GDPR Compliant**: Data retention and deletion policies

## 🤝 Support & Contact

### Getting Help
- Review the installation instructions above
- Check that your OpenAI API key has Realtime API access
- Ensure Node.js 18+ and PostgreSQL are properly installed
- Verify `.env` file configuration and database connection

### Enterprise Support
For enterprise licensing, custom features, or support:
- Website: [https://pragyaa.ai](https://pragyaa.ai)
- Email: support@pragyaa.ai

### Technical Requirements
- Modern web browser with WebRTC support
- Microphone access for voice evaluations
- Stable internet connection (minimum 1 Mbps)
- PostgreSQL 12+ database server

---

**Transform your hiring process with AI-powered evaluations.** CCEval delivers consistent, unbiased, and comprehensive candidate assessments at scale. 🚀

---

© 2025 Pragyaa.ai - All Rights Reserved

This software is proprietary and licensed for commercial use only by Pragyaa.ai.
See LICENSE file for complete terms and conditions.
