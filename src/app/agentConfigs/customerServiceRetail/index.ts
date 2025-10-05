import { authenticationAgent } from './authentication';
import { returnsAgent } from './returns';
import { salesAgent } from './sales';
import { simulatedHumanAgent } from './simulatedHuman';
import { spotlightAgent } from './spotlight';
import { carDealerAgent } from './carDealer';
import { voiceQualityAgent } from './voiceQualityAgent';

// Cast to `any` to satisfy TypeScript until the core types make RealtimeAgent
// assignable to `Agent<unknown>` (current library versions are invariant on
// the context type).

// Evaluation Agent can only hand off to Voice Quality Agent and Human Agent
(authenticationAgent.handoffs as any).push(voiceQualityAgent, simulatedHumanAgent);

// Voice Quality Agent hands back to Evaluation Agent only
(voiceQualityAgent.handoffs as any).push(authenticationAgent);

// Human Agent hands back to Evaluation Agent only
(simulatedHumanAgent.handoffs as any).push(authenticationAgent);

// Other agents (not used in HCE Evaluations scenario)
(returnsAgent.handoffs as any).push(authenticationAgent, salesAgent, simulatedHumanAgent, spotlightAgent, carDealerAgent);
(salesAgent.handoffs as any).push(authenticationAgent, returnsAgent, simulatedHumanAgent, spotlightAgent, carDealerAgent);
(spotlightAgent.handoffs as any).push(carDealerAgent, simulatedHumanAgent);
(carDealerAgent.handoffs as any).push(authenticationAgent, returnsAgent, salesAgent, simulatedHumanAgent, spotlightAgent);

export const customerServiceRetailScenario = [
  authenticationAgent,
  voiceQualityAgent,   // Now visible for testing handoff
  // returnsAgent,        // Hidden from dropdown
  // salesAgent,          // Hidden from dropdown  
  // simulatedHumanAgent, // Hidden from dropdown
  // spotlightAgent,      // Hidden from dropdown - available for future Topik use
  // carDealerAgent,      // Hidden from dropdown - available for future Topik use
];

// Name of the company represented by this agent set. Used by guardrails
export const customerServiceRetailCompanyName = 'Hansa';
