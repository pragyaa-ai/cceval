import { RealtimeAgent, tool } from '@openai/agents/realtime';

/**
 * AeroDoc Agent - AI-Powered Documentation Assistant for Aircraft Maintenance
 * 
 * This agent helps aircraft maintenance engineers with documentation by:
 * - Capturing information through voice dictation
 * - Converting unstructured input into standardized, structured drafts
 * - Maintaining complete audit trails
 * - Requiring human confirmation before any action
 * 
 * Key Principle: AeroDoc supports, not replaces, licensed maintenance authority.
 * All AI-generated outputs require explicit human confirmation.
 */

// Document templates for different maintenance documentation types
const DOCUMENT_TEMPLATES = {
  task_completion: {
    name: "Task Card Completion",
    fields: ["task_card_number", "ata_chapter", "aircraft_reg", "task_description", "findings", "corrective_action", "parts_used", "man_hours"]
  },
  discrepancy_report: {
    name: "Discrepancy Report",
    fields: ["discrepancy_id", "ata_chapter", "aircraft_reg", "defect_description", "location", "discovered_during", "action_required", "deferral_reference"]
  },
  component_record: {
    name: "Component Removal/Installation",
    fields: ["work_order", "ata_chapter", "aircraft_reg", "component_description", "part_number", "serial_number_off", "serial_number_on", "reason", "test_requirements"]
  },
  inspection_finding: {
    name: "Inspection Finding",
    fields: ["inspection_reference", "ata_chapter", "aircraft_reg", "inspection_type", "area_inspected", "findings", "measurements", "serviceable_status"]
  },
  maintenance_action: {
    name: "Maintenance Action Description",
    fields: ["work_order", "ata_chapter", "aircraft_reg", "action_type", "description", "reference_documents", "tools_equipment", "result"]
  }
};

// Common ATA chapters for reference
const ATA_CHAPTERS = {
  "21": "Air Conditioning",
  "22": "Auto Flight",
  "23": "Communications",
  "24": "Electrical Power",
  "25": "Equipment/Furnishings",
  "26": "Fire Protection",
  "27": "Flight Controls",
  "28": "Fuel",
  "29": "Hydraulic Power",
  "30": "Ice and Rain Protection",
  "31": "Instruments",
  "32": "Landing Gear",
  "33": "Lights",
  "34": "Navigation",
  "35": "Oxygen",
  "36": "Pneumatic",
  "38": "Water/Waste",
  "49": "Airborne Auxiliary Power",
  "52": "Doors",
  "53": "Fuselage",
  "54": "Nacelles/Pylons",
  "55": "Stabilizers",
  "56": "Windows",
  "57": "Wings",
  "71": "Power Plant",
  "72": "Engine",
  "73": "Engine Fuel and Control",
  "74": "Ignition",
  "75": "Air",
  "76": "Engine Controls",
  "77": "Engine Indicating",
  "78": "Exhaust",
  "79": "Oil",
  "80": "Starting"
};

export const aerodocAgent = new RealtimeAgent({
  name: 'AeroDoc Documentation Assistant',
  voice: 'coral',
  handoffDescription:
    'AeroDoc - AI-powered documentation assistant for aircraft maintenance engineers. Captures voice dictation, processes information, and generates structured documentation drafts for human review and confirmation.',

  instructions: `
# AERODOC - AIRCRAFT MAINTENANCE DOCUMENTATION ASSISTANT

## HIGH-LEVEL GOAL
You are AeroDoc, an AI-powered documentation assistant designed to help aircraft maintenance engineers create accurate, standardized documentation efficiently. You capture information through voice dictation and convert it into structured drafts ready for human review.

## IDENTITY & PERSONA
You are "Doc," a knowledgeable and professional documentation assistant for aviation maintenance:
1. **Expert in Aviation Documentation:** Understand ATA chapters, MEL/CDL references, part numbers, and maintenance terminology
2. **Accurate Transcription:** Capture spoken maintenance findings precisely
3. **Structured Output:** Convert free-form dictation into standardized documentation formats
4. **Compliance-Focused:** Maintain complete audit trails and require human confirmation

## VOICE & ACCENT
Speak with a clear, professional tone:
- Use concise, technical language appropriate for aviation
- Confirm information back to ensure accuracy
- Be efficient and respectful of the engineer's time

---

## CRITICAL PRINCIPLES

### 1. HUMAN-IN-THE-LOOP REQUIREMENT
**NEVER** finalize or submit any documentation without explicit human confirmation.
- All outputs are DRAFTS until confirmed by a licensed maintenance professional
- Always present drafts for review before any action
- Record confirmation timestamps and user identity

### 2. NO BACKEND INTEGRATION
AeroDoc does NOT connect to AMOS or any MRO system backend.
- Generate documentation drafts for manual entry
- Engineers copy/export confirmed drafts to their systems

### 3. NO AUTOMATION OF AUTHORITY
AI generates drafts only.
- Inspection sign-offs remain with licensed personnel
- CRS (Certificate of Release to Service) authority is NOT automated
- All authorizations require human action

---

## WORKFLOW PHASES

### PHASE 1: SESSION INITIALIZATION
**Duration:** 30 seconds

1. Greet the engineer: "Hello, this is Doc, your AeroDoc documentation assistant. I'm here to help you document your maintenance work."
2. Ask about the documentation type: "What type of documentation would you like to create today? I can help with:
   - Task card completion summaries
   - Discrepancy reports
   - Component removal/installation records
   - Inspection findings
   - Maintenance action descriptions"
3. Capture the selection using capture_session_data tool

### PHASE 2: INFORMATION CAPTURE
**Duration:** Varies

Based on the selected documentation type, guide the engineer through providing required information:

1. **Start Recording:** "Alright, let's begin. Please tell me the aircraft registration and the ATA chapter for this task."

2. **Structured Prompts:** Ask for each required field based on the template:
   - For Task Completion: task card number, findings, corrective actions, parts used
   - For Discrepancy: defect description, location, discovered during what activity
   - For Component: part numbers, serial numbers, reason for removal
   - For Inspection: area inspected, findings, measurements, serviceability

3. **Clarification:** If any information is unclear, ask for clarification:
   - "Could you please spell that part number?"
   - "I heard ATA 32-10. Is that correct?"
   - "What was the serial number of the component removed?"

4. **Read-Back:** After capturing information, read back key details for confirmation:
   - "Let me confirm: Aircraft VT-ABC, ATA 32-10-00, nose gear inspection..."

### PHASE 3: DRAFT GENERATION
**Duration:** 30-60 seconds

1. **Announce Draft Generation:** "Thank you. I'm now generating a structured draft based on the information you provided."

2. **Generate Draft:** Use generate_documentation_draft tool to create the structured output

3. **Present Draft:** "Here's the draft I've prepared. Please review it carefully:"
   - Read out the key sections of the draft
   - Highlight any fields that may need attention

4. **Request Review:** "Would you like me to make any changes to this draft before you confirm it?"

### PHASE 4: HUMAN REVIEW & CONFIRMATION
**Duration:** Varies

1. **Handle Edits:** If the engineer requests changes:
   - "Understood. What changes would you like to make?"
   - Use update_draft tool to modify the draft
   - Read back the updated version

2. **Request Confirmation:** Once the engineer is satisfied:
   - "When you're ready, please say 'confirm' to finalize this draft, or 'edit' to make more changes."

3. **Confirm Draft:** When the engineer confirms:
   - Use confirm_draft tool to record the confirmation
   - "Draft confirmed at [timestamp]. This is now ready for entry into your MRO system."
   - "Would you like me to provide export options?"

### PHASE 5: EXPORT & SESSION END
**Duration:** 30 seconds

1. **Export Options:** "You can now:
   - Copy the text to clipboard
   - Export as a formatted document
   - Print the draft"

2. **Audit Trail:** "A complete audit trail of this session has been saved for your records."

3. **Session End:** "Is there anything else you'd like to document? If not, say 'end session' to close."

---

## AVIATION TERMINOLOGY RECOGNITION

Understand and correctly process:

### ATA Chapters
- Recognize two-digit chapter references (e.g., "ATA 32" = Landing Gear)
- Recognize full references (e.g., "32-10-00" = Nose Landing Gear)

### Part Numbers & Serial Numbers
- Alphanumeric part numbers (e.g., "PN 65C28976-43")
- Serial numbers (e.g., "SN ABC12345")

### Maintenance References
- MEL (Minimum Equipment List) items
- CDL (Configuration Deviation List) items
- AMM (Aircraft Maintenance Manual) references
- SRM (Structural Repair Manual) references
- CMM (Component Maintenance Manual) references

### Common Abbreviations
- NLG (Nose Landing Gear), MLG (Main Landing Gear)
- IDG (Integrated Drive Generator)
- APU (Auxiliary Power Unit)
- CRS (Certificate of Release to Service)
- NDT (Non-Destructive Testing)

---

## TOOL USAGE

### Session Management
- capture_session_data: Record session type, aircraft info, and metadata
- end_session: Close the session and finalize audit trail

### Documentation
- generate_documentation_draft: Create structured draft from captured information
- update_draft: Modify draft based on engineer feedback
- confirm_draft: Record human confirmation of draft

### Information Lookup
- get_ata_chapter_info: Look up ATA chapter description
- get_template_fields: Get required fields for a document type

---

## IMPORTANT RULES

1. **ALWAYS** confirm information read-back before generating drafts
2. **NEVER** suggest or imply that documentation is final without human confirmation
3. **ALWAYS** maintain professional, efficient communication
4. **CAPTURE** all changes and confirmations in the audit trail
5. **RESPECT** the engineer's time - be concise and focused
6. **ASK** for clarification on part numbers, serial numbers, and technical details
7. **USE** proper aviation terminology and abbreviations
`,

  tools: [
    tool({
      name: "capture_session_data",
      description: "Capture session information including documentation type, aircraft details, and metadata. Use at the start of each documentation session.",
      parameters: {
        type: "object",
        properties: {
          data_type: {
            type: "string",
            enum: [
              "session_type",
              "aircraft_registration",
              "ata_chapter",
              "work_order",
              "task_card_number",
              "component_info",
              "findings",
              "corrective_action",
              "parts_used",
              "measurements",
              "reference_documents",
              "engineer_notes",
              "session_metadata"
            ],
            description: "The type of session data being captured"
          },
          value: {
            type: "string",
            description: "The value being recorded"
          },
          notes: {
            type: "string",
            description: "Additional notes or context"
          }
        },
        required: ["data_type", "value"],
        additionalProperties: false,
      },
      execute: async (input, details) => {
        const typedInput = input as { data_type: string; value: string; notes?: string };
        const context = details?.context as any;
        
        const timestamp = new Date().toISOString();
        
        if (context?.captureDataPoint) {
          context.captureDataPoint(typedInput.data_type, typedInput.value, 'captured', typedInput.notes);
          console.log(`[AeroDoc] 📝 Captured ${typedInput.data_type}: ${typedInput.value} at ${timestamp}`);
          return { 
            success: true, 
            message: `Captured ${typedInput.data_type}: ${typedInput.value}`,
            timestamp,
            audit_entry: {
              event: 'data_captured',
              data_type: typedInput.data_type,
              timestamp
            }
          };
        }
        
        console.log(`[AeroDoc - No Context] ${typedInput.data_type}: ${typedInput.value}`);
        return { 
          success: true, 
          message: `Logged ${typedInput.data_type}: ${typedInput.value}`,
          timestamp
        };
      },
    }),

    tool({
      name: "get_ata_chapter_info",
      description: "Look up ATA chapter description by chapter number",
      parameters: {
        type: "object",
        properties: {
          chapter_number: {
            type: "string",
            description: "The ATA chapter number (e.g., '32', '71')"
          }
        },
        required: ["chapter_number"],
        additionalProperties: false,
      },
      execute: async (input) => {
        const typedInput = input as { chapter_number: string };
        const chapter = typedInput.chapter_number.replace(/^0+/, ''); // Remove leading zeros
        const description = ATA_CHAPTERS[chapter as keyof typeof ATA_CHAPTERS];
        
        return {
          success: !!description,
          chapter: chapter,
          description: description || 'Unknown ATA chapter',
          message: description 
            ? `ATA ${chapter}: ${description}`
            : `ATA chapter ${chapter} not found in reference`
        };
      },
    }),

    tool({
      name: "get_template_fields",
      description: "Get the required fields for a specific document template type",
      parameters: {
        type: "object",
        properties: {
          template_type: {
            type: "string",
            enum: ["task_completion", "discrepancy_report", "component_record", "inspection_finding", "maintenance_action"],
            description: "The type of documentation template"
          }
        },
        required: ["template_type"],
        additionalProperties: false,
      },
      execute: async (input) => {
        const typedInput = input as { template_type: keyof typeof DOCUMENT_TEMPLATES };
        const template = DOCUMENT_TEMPLATES[typedInput.template_type];
        
        return {
          success: true,
          template_name: template.name,
          required_fields: template.fields,
          message: `Template '${template.name}' requires: ${template.fields.join(', ')}`
        };
      },
    }),

    tool({
      name: "generate_documentation_draft",
      description: "Generate a structured documentation draft from the captured information. This creates a DRAFT that requires human confirmation.",
      parameters: {
        type: "object",
        properties: {
          template_type: {
            type: "string",
            enum: ["task_completion", "discrepancy_report", "component_record", "inspection_finding", "maintenance_action"],
            description: "The type of documentation template to use"
          },
          draft_content: {
            type: "string",
            description: "The structured content for the draft"
          }
        },
        required: ["template_type", "draft_content"],
        additionalProperties: false,
      },
      execute: async (input, details) => {
        const typedInput = input as { template_type: string; draft_content: string };
        const context = details?.context as any;
        const timestamp = new Date().toISOString();
        
        const template = DOCUMENT_TEMPLATES[typedInput.template_type as keyof typeof DOCUMENT_TEMPLATES];
        
        console.log(`[AeroDoc] 📄 Generated draft using template: ${template?.name}`);
        
        if (context?.captureDataPoint) {
          context.captureDataPoint('draft_generated', typedInput.draft_content, 'draft', template?.name);
        }
        
        return {
          success: true,
          draft_status: 'PENDING_CONFIRMATION',
          template_used: template?.name || typedInput.template_type,
          content: typedInput.draft_content,
          timestamp,
          audit_entry: {
            event: 'draft_generated',
            template: template?.name,
            timestamp
          },
          message: `Draft generated using ${template?.name || typedInput.template_type} template. AWAITING HUMAN CONFIRMATION.`
        };
      },
    }),

    tool({
      name: "update_draft",
      description: "Update an existing draft based on engineer feedback. Records the change in the audit trail.",
      parameters: {
        type: "object",
        properties: {
          field_to_update: {
            type: "string",
            description: "The field or section being updated"
          },
          old_value: {
            type: "string",
            description: "The previous value"
          },
          new_value: {
            type: "string",
            description: "The new value"
          },
          reason: {
            type: "string",
            description: "Reason for the change"
          }
        },
        required: ["field_to_update", "new_value"],
        additionalProperties: false,
      },
      execute: async (input, details) => {
        const typedInput = input as { field_to_update: string; old_value?: string; new_value: string; reason?: string };
        const context = details?.context as any;
        const timestamp = new Date().toISOString();
        
        console.log(`[AeroDoc] ✏️ Draft updated: ${typedInput.field_to_update} changed to ${typedInput.new_value}`);
        
        if (context?.captureDataPoint) {
          context.captureDataPoint('draft_edit', `${typedInput.field_to_update}: ${typedInput.new_value}`, 'edited', typedInput.reason);
        }
        
        return {
          success: true,
          draft_status: 'PENDING_CONFIRMATION',
          change: {
            field: typedInput.field_to_update,
            old_value: typedInput.old_value || 'N/A',
            new_value: typedInput.new_value,
            reason: typedInput.reason || 'Engineer requested change'
          },
          timestamp,
          audit_entry: {
            event: 'draft_edited',
            field: typedInput.field_to_update,
            timestamp
          },
          message: `Draft updated. Field '${typedInput.field_to_update}' changed. STILL AWAITING HUMAN CONFIRMATION.`
        };
      },
    }),

    tool({
      name: "confirm_draft",
      description: "Record human confirmation of a draft. This finalizes the draft and records the confirmation in the audit trail. ONLY call this when the engineer explicitly confirms.",
      parameters: {
        type: "object",
        properties: {
          confirmation_statement: {
            type: "string",
            description: "The confirmation statement from the engineer"
          }
        },
        required: ["confirmation_statement"],
        additionalProperties: false,
      },
      execute: async (input, details) => {
        const typedInput = input as { confirmation_statement: string };
        const context = details?.context as any;
        const timestamp = new Date().toISOString();
        
        console.log(`[AeroDoc] ✅ Draft CONFIRMED at ${timestamp}`);
        
        if (context?.captureDataPoint) {
          context.captureDataPoint('draft_confirmed', typedInput.confirmation_statement, 'confirmed', timestamp);
        }
        
        return {
          success: true,
          draft_status: 'CONFIRMED',
          confirmation_timestamp: timestamp,
          audit_entry: {
            event: 'draft_confirmed',
            confirmation: typedInput.confirmation_statement,
            timestamp
          },
          message: `Draft CONFIRMED at ${timestamp}. Ready for export and manual entry into MRO system.`,
          next_steps: [
            'Copy text to clipboard',
            'Export as formatted document',
            'Print draft',
            'Enter into MRO system manually'
          ]
        };
      },
    }),

    tool({
      name: "end_session",
      description: "End the documentation session and finalize the audit trail.",
      parameters: {
        type: "object",
        properties: {
          session_notes: {
            type: "string",
            description: "Any final notes for the session"
          }
        },
        required: [],
        additionalProperties: false,
      },
      execute: async (input, details) => {
        const typedInput = input as { session_notes?: string };
        const context = details?.context as any;
        const timestamp = new Date().toISOString();
        
        console.log(`[AeroDoc] 🔚 Session ended at ${timestamp}`);
        
        if (context?.captureDataPoint) {
          context.captureDataPoint('session_ended', typedInput.session_notes || 'Session completed', 'completed', timestamp);
        }
        
        return {
          success: true,
          session_status: 'ENDED',
          end_timestamp: timestamp,
          audit_entry: {
            event: 'session_ended',
            notes: typedInput.session_notes,
            timestamp
          },
          message: `Documentation session ended at ${timestamp}. Complete audit trail has been saved.`
        };
      },
    }),

    // Voice analysis tools (reused from evaluation agents for consistency)
    tool({
      name: "start_voice_capture",
      description: "Start capturing voice dictation from the engineer.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
      execute: async (_input, details) => {
        const context = details?.context as any;
        const timestamp = new Date().toISOString();
        
        console.log('[AeroDoc] 🎤 Voice capture started');
        
        if (context?.startVoiceAnalysis) {
          context.startVoiceAnalysis();
        }
        
        return { 
          success: true, 
          message: 'Voice capture started. Please begin your dictation.',
          timestamp,
          audit_entry: {
            event: 'voice_capture_started',
            timestamp
          }
        };
      },
    }),

    tool({
      name: "stop_voice_capture",
      description: "Stop capturing voice dictation.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
      execute: async (_input, details) => {
        const context = details?.context as any;
        const timestamp = new Date().toISOString();
        
        if (context?.stopVoiceAnalysis) {
          context.stopVoiceAnalysis();
        }
        
        console.log('[AeroDoc] 🎤 Voice capture stopped');
        
        return { 
          success: true, 
          message: 'Voice capture stopped.',
          timestamp,
          audit_entry: {
            event: 'voice_capture_stopped',
            timestamp
          }
        };
      },
    }),
  ],

  handoffs: [],
});

export default aerodocAgent;
