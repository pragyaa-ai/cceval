/**
 * Seed script to create sample evaluation scenarios
 * Run with: node scripts/seed-scenarios.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding sample scenarios...');

  // First, ensure we have an organization
  const org = await prisma.organization.upsert({
    where: { slug: 'sample-org' },
    update: {},
    create: {
      id: 'sample-org-001',
      name: 'Sample Organization',
      slug: 'sample-org',
      description: 'Sample organization with pre-built scenarios',
      primaryColor: '#7c3aed',
      secondaryColor: '#8b5cf6',
    },
  });

  console.log(`✅ Organization: ${org.name}`);

  // Create Automotive Call Center Scenario
  const automotiveScenario = await prisma.evaluationScenario.upsert({
    where: { id: 'scenario-automotive-001' },
    update: {},
    create: {
      id: 'scenario-automotive-001',
      name: 'Automotive Call Center Evaluation',
      description: 'Comprehensive evaluation for automotive customer service representatives. Covers product knowledge, customer handling, and professional communication for car sales and support.',
      industry: 'Automotive',
      roleType: 'Sales',
      organizationId: org.id,
      agentName: 'Eva',
      agentVoice: 'coral',
      agentPersona: 'Professional AI interviewer with expertise in automotive customer service evaluation. Speaks with a warm, professional North Indian English accent.',
      status: 'active',
      isDefault: true,
    },
  });

  console.log(`✅ Scenario: ${automotiveScenario.name}`);

  // Seed Scoring Criteria for Automotive Scenario
  const automotiveCriteria = [
    {
      parameterId: 'clarity_pace',
      label: 'Clarity & Pace',
      description: 'Smooth flow of speech, clear articulation, no hesitation or fumbling',
      category: 'voice_quality',
      scoringGuidance: 'Listen for clear pronunciation, appropriate speaking speed, and natural pauses. Score lower for mumbling, rushed speech, or excessive filler words.',
      displayOrder: 1,
    },
    {
      parameterId: 'product_knowledge',
      label: 'Product Knowledge',
      description: 'Understanding of automotive products, features, and specifications (PV & EV)',
      category: 'domain_knowledge',
      scoringGuidance: 'Evaluate accuracy of product information, ability to explain features, and knowledge of competitive positioning.',
      displayOrder: 2,
    },
    {
      parameterId: 'empathy',
      label: 'Empathy',
      description: 'Quality of reassurance lines and emotional intelligence in customer interactions',
      category: 'soft_skills',
      scoringGuidance: 'Look for phrases like "I understand your concern", acknowledgment of customer feelings, and genuine care in responses.',
      displayOrder: 3,
    },
    {
      parameterId: 'customer_understanding',
      label: 'Customer Understanding',
      description: 'Ability to probe customer needs through effective questioning and active listening',
      category: 'communication',
      scoringGuidance: 'Evaluate use of open-ended questions, paraphrasing, and ability to identify underlying needs.',
      displayOrder: 4,
    },
    {
      parameterId: 'handling_pressure',
      label: 'Handling Pressure',
      description: 'Composure and professionalism in tough scenarios and with difficult customers',
      category: 'soft_skills',
      scoringGuidance: 'Observe for voice stability, maintained professionalism, and effective de-escalation techniques.',
      displayOrder: 5,
    },
    {
      parameterId: 'confidence',
      label: 'Confidence',
      description: 'Tone stability and self-assurance throughout the conversation',
      category: 'voice_quality',
      scoringGuidance: 'Listen for consistent volume, assertive (not aggressive) tone, and recovery from mistakes.',
      displayOrder: 6,
    },
    {
      parameterId: 'process_accuracy',
      label: 'Process Accuracy',
      description: 'Lead capturing, summarizing customer needs, and clear call-to-action',
      category: 'process_compliance',
      scoringGuidance: 'Check for proper data collection, accurate summarization, and appropriate next steps offered.',
      displayOrder: 7,
    },
    {
      parameterId: 'closure_quality',
      label: 'Closure Quality',
      description: 'Professional, crisp, and complete call closure with next steps',
      category: 'communication',
      scoringGuidance: 'Evaluate final summary, confirmation of next steps, professional sign-off, and overall call wrap-up.',
      displayOrder: 8,
    },
  ];

  for (const criteria of automotiveCriteria) {
    await prisma.scoringCriteria.upsert({
      where: {
        scenarioId_parameterId: {
          scenarioId: automotiveScenario.id,
          parameterId: criteria.parameterId,
        },
      },
      update: criteria,
      create: {
        ...criteria,
        scenarioId: automotiveScenario.id,
      },
    });
  }

  console.log(`✅ Added ${automotiveCriteria.length} criteria to ${automotiveScenario.name}`);

  // Seed Reading Passages for Automotive
  const automotivePassages = [
    {
      id: 'passage-safety-adas',
      title: 'Safety & ADAS',
      text: 'Safety has become a top priority in the Indian automobile market. Features like six airbags, advanced driver assistance systems, electronic stability control, and hill hold assist help drivers manage difficult road and traffic conditions. As customers compare multiple brands, explaining these safety features in simple, relatable terms plays an important role in building trust and supporting informed decision-making.',
      wordCount: 63,
      context: 'Use this passage to assess voice clarity when explaining technical safety features.',
      difficulty: 'medium',
      isDefault: true,
    },
    {
      id: 'passage-ev-charging',
      title: 'EV Fast Charging',
      text: 'Electric vehicle customers in India look for fast-charging capability, practical daily range, and battery longevity. With growing public charging infrastructure, modern EVs offer quick charge options that significantly reduce waiting time. Communicating these benefits clearly helps customers understand the convenience of adopting an electric vehicle for long commutes and everyday usage.',
      wordCount: 58,
      context: 'Use this passage for candidates applying to EV-focused roles.',
      difficulty: 'medium',
    },
    {
      id: 'passage-connected-car',
      title: 'Connected Car Technology',
      text: 'Connected car technology is becoming essential in India, with drivers expecting features like remote lock–unlock, live vehicle tracking, geo-fencing, emergency alerts, and over-the-air updates. These features not only enhance safety but also improve convenience. When speaking to customers, it is important to describe how these technologies add value to their daily driving experience.',
      wordCount: 61,
      context: 'Tests ability to explain modern tech features.',
      difficulty: 'hard',
    },
  ];

  for (const passage of automotivePassages) {
    await prisma.readingPassage.upsert({
      where: { id: passage.id },
      update: passage,
      create: {
        ...passage,
        scenarioId: automotiveScenario.id,
      },
    });
  }

  console.log(`✅ Added ${automotivePassages.length} reading passages`);

  // Seed Role-Play Scenarios
  const rolePlayScenarios = [
    {
      id: 'roleplay-beginner',
      title: 'Basic Inquiry - Bolero Neo',
      description: 'Customer inquires about basic price and features of Bolero Neo',
      customerName: 'Rajesh Kumar',
      customerPersona: 'Middle-aged customer, first-time car buyer, budget-conscious, looking for a reliable SUV for family use.',
      customerMood: 'neutral',
      openingLine: 'Hi, I saw the Mahindra Bolero Neo online. Can you tell me the basic price?',
      context: 'Customer is comparing options and needs clear, simple information about pricing and features.',
      expectedBehaviors: JSON.stringify([
        'Greet professionally and introduce self',
        'Ask about customer requirements before quoting price',
        'Explain key features relevant to family use',
        'Offer test drive or follow-up call',
      ]),
      difficulty: 'beginner',
      displayOrder: 1,
    },
    {
      id: 'roleplay-moderate',
      title: 'Comparison Scenario - XUV700 vs Competition',
      description: 'Customer compares XUV700 with Hyundai Alcazar, needs convincing',
      customerName: 'Priya Sharma',
      customerPersona: 'Young professional, tech-savvy, comparing multiple brands, values safety and technology features.',
      customerMood: 'neutral',
      openingLine: "I'm comparing the XUV700 with Hyundai Alcazar. Why should I choose Mahindra?",
      context: 'Customer has done research and expects detailed comparison with specific advantages.',
      expectedBehaviors: JSON.stringify([
        'Acknowledge the comparison positively',
        'Highlight unique XUV700 advantages (5-star safety, ADAS)',
        'Address specific concerns without criticizing competitor',
        'Offer test drive to experience the difference',
      ]),
      difficulty: 'moderate',
      displayOrder: 2,
    },
    {
      id: 'roleplay-experienced',
      title: 'Tough EV Scenario - XUV400 Concerns',
      description: 'Frustrated customer with EV concerns about charging and range anxiety',
      customerName: 'Arun Patel',
      customerPersona: 'Skeptical customer, worried about EV practicality, has heard negative things about electric vehicles.',
      customerMood: 'frustrated',
      openingLine: "Your EV looks good, but I'm worried about charging time and battery life. I don't want to get stuck!",
      context: 'Customer needs reassurance with facts and empathy. This tests de-escalation and product knowledge.',
      expectedBehaviors: JSON.stringify([
        'Acknowledge concerns with empathy',
        'Provide accurate charging time and range information',
        'Explain warranty and battery longevity',
        'Share real customer experiences if possible',
        'Convert concern to confidence',
      ]),
      escalationTriggers: JSON.stringify([
        'If candidate dismisses concerns',
        'If candidate provides inaccurate information',
        'If candidate sounds unsure or nervous',
      ]),
      difficulty: 'experienced',
      displayOrder: 3,
    },
  ];

  for (const rolePlay of rolePlayScenarios) {
    await prisma.rolePlayScenario.upsert({
      where: { id: rolePlay.id },
      update: rolePlay,
      create: {
        ...rolePlay,
        scenarioId: automotiveScenario.id,
      },
    });
  }

  console.log(`✅ Added ${rolePlayScenarios.length} role-play scenarios`);

  // Create a second sample scenario: Banking Call Center
  const bankingScenario = await prisma.evaluationScenario.upsert({
    where: { id: 'scenario-banking-001' },
    update: {},
    create: {
      id: 'scenario-banking-001',
      name: 'Banking Call Center Evaluation',
      description: 'Evaluation framework for banking and financial services representatives. Focuses on product knowledge, compliance, and customer trust building.',
      industry: 'Banking & Finance',
      roleType: 'Customer Support',
      organizationId: org.id,
      agentName: 'Eva',
      agentVoice: 'coral',
      status: 'active',
      isDefault: false,
    },
  });

  // Add Banking-specific criteria
  const bankingCriteria = [
    {
      parameterId: 'clarity_pace',
      label: 'Clarity & Pace',
      description: 'Clear speech, appropriate speed for financial information',
      category: 'voice_quality',
      displayOrder: 1,
    },
    {
      parameterId: 'product_knowledge',
      label: 'Financial Product Knowledge',
      description: 'Understanding of banking products, rates, and terms',
      category: 'domain_knowledge',
      displayOrder: 2,
    },
    {
      parameterId: 'compliance_awareness',
      label: 'Compliance Awareness',
      description: 'Adherence to regulatory guidelines and proper disclosures',
      category: 'process_compliance',
      displayOrder: 3,
    },
    {
      parameterId: 'trust_building',
      label: 'Trust Building',
      description: 'Ability to build customer confidence in financial matters',
      category: 'soft_skills',
      displayOrder: 4,
    },
    {
      parameterId: 'objection_handling',
      label: 'Objection Handling',
      description: 'Skill in addressing customer concerns about rates, fees, etc.',
      category: 'communication',
      displayOrder: 5,
    },
    {
      parameterId: 'data_accuracy',
      label: 'Data Accuracy',
      description: 'Precision in capturing customer information and account details',
      category: 'process_compliance',
      displayOrder: 6,
    },
  ];

  for (const criteria of bankingCriteria) {
    await prisma.scoringCriteria.upsert({
      where: {
        scenarioId_parameterId: {
          scenarioId: bankingScenario.id,
          parameterId: criteria.parameterId,
        },
      },
      update: criteria,
      create: {
        ...criteria,
        scenarioId: bankingScenario.id,
        scoringGuidance: '',
      },
    });
  }

  console.log(`✅ Created Banking scenario with ${bankingCriteria.length} criteria`);

  console.log('\n🎉 Seeding complete!');
  console.log('\nSample scenarios created:');
  console.log('1. Automotive Call Center Evaluation (with full criteria, passages, role-plays)');
  console.log('2. Banking Call Center Evaluation (with basic criteria)');
  console.log('\nTo use these scenarios, assign users to the "Sample Organization"');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

