// Agent Exports
export { mahindraEvaluationAgent } from './mahindraEvaluationAgent';
export { ccevalAgent } from './ccevalAgent';
export { aceevalAgent } from './aceevalAgent';
export { aerodocAgent } from './aerodocAgent';

// =============================================================================
// V2 Agent Configuration (Legacy - Mahindra)
// =============================================================================
export const v2AgentScenario = [
  require('./mahindraEvaluationAgent').mahindraEvaluationAgent,
];
export const v2CompanyName = 'Mahindra';

// =============================================================================
// CCEval v2.1.0 - Call Center Evaluation
// =============================================================================
// Features:
// - 6-phase voice evaluation (Personal Questions, Reading, Call Scenario, Empathy, Typing, Closure)
// - Voice analysis during reading task
// - 8 scoring parameters with calibration support
// - Three use cases: PV Sales, EV Sales, Service
// - Three difficulty levels: Beginner, Moderate, Experienced
export const ccevalAgentScenario = [
  require('./ccevalAgent').ccevalAgent,
];
export const ccevalCompanyName = 'CCEval';

// =============================================================================
// AceEval - Professional Evaluation Assessment
// =============================================================================
// Features:
// - Generic evaluation framework (not Mahindra-specific)
// - Same 6-phase structure as CCEval
// - Customizable scenarios and passages
// - Ready for industry-specific customization
export const aceevalAgentScenario = [
  require('./aceevalAgent').aceevalAgent,
];
export const aceevalCompanyName = 'AceEval';

// =============================================================================
// AeroDoc - Aircraft Maintenance Documentation Assistant
// =============================================================================
// Features:
// - Voice dictation for maintenance documentation
// - Aviation terminology recognition (ATA chapters, MEL/CDL, part numbers)
// - Structured documentation templates:
//   - Task Card Completion
//   - Discrepancy Reports
//   - Component Removal/Installation Records
//   - Inspection Findings
//   - Maintenance Action Descriptions
// - Human-in-the-loop confirmation workflow
// - Complete audit trail for compliance
// - NO backend integration (manual MRO entry)
export const aerodocAgentScenario = [
  require('./aerodocAgent').aerodocAgent,
];
export const aerodocCompanyName = 'AeroDoc';

// =============================================================================
// Agent Registry - All available agents
// =============================================================================
export const AGENT_REGISTRY = {
  mahindra: {
    name: 'Mahindra Evaluation',
    agent: require('./mahindraEvaluationAgent').mahindraEvaluationAgent,
    type: 'evaluation',
    version: '2.0'
  },
  cceval: {
    name: 'CCEval v2.1.0',
    agent: require('./ccevalAgent').ccevalAgent,
    type: 'evaluation',
    version: '2.1.0'
  },
  aceeval: {
    name: 'AceEval',
    agent: require('./aceevalAgent').aceevalAgent,
    type: 'evaluation',
    version: '1.0'
  },
  aerodoc: {
    name: 'AeroDoc',
    agent: require('./aerodocAgent').aerodocAgent,
    type: 'documentation',
    version: '1.0'
  }
} as const;

export type AgentKey = keyof typeof AGENT_REGISTRY;


















