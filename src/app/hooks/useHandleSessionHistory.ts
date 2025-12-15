"use client";

import { useRef, useEffect } from "react";
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { useEvent } from "@/app/contexts/EventContext";
import OpenAI from 'openai';

async function correctTextScript(text: string): Promise<string> {
  const devanagariRegex = /[\u0900-\u097F]/;

  if (devanagariRegex.test(text)) {
    return text;
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });

    const correctionResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a language expert. Your task is to transliterate the given text into the Devanagari script for Hindi. Do not translate. Only provide the transliterated text."
        },
        {
          role: "user",
          content: `Please transliterate the following text to the Devanagari script: "${text}"`
        }
      ],
      temperature: 0,
    });

    return correctionResponse.choices[0].message.content || text;
  } catch (err) {
    console.error('Error during text correction:', err);
    return text;
  }
}

/**
 * Sanitize text to only contain English and Hindi (Devanagari) characters.
 * Removes characters from other scripts like Arabic, Chinese, Japanese, etc.
 * 
 * Allowed characters:
 * - English letters (A-Z, a-z)
 * - Devanagari script (Hindi): Unicode range \u0900-\u097F
 * - Numbers (0-9)
 * - Common punctuation and symbols
 * - Whitespace
 */
function sanitizeToEnglishHindi(text: string): string {
  if (!text) return text;
  
  // Regex pattern for allowed characters:
  // - a-zA-Z: English letters
  // - 0-9: Numbers
  // - \u0900-\u097F: Devanagari (Hindi) script
  // - Common punctuation: . , ! ? ' " - : ; ( ) [ ] / @ # $ % & * + = < > ~ ` ^ _ | \
  // - Whitespace: \s
  const allowedPattern = /[a-zA-Z0-9\u0900-\u097F\s.,!?'"\-:;()\[\]\/@#$%&*+=<>~`^_|\\]+/g;
  
  const matches = text.match(allowedPattern);
  if (!matches) return "";
  
  const sanitized = matches.join("");
  
  // If significant characters were removed, log for debugging
  if (sanitized.length < text.length * 0.8) {
    console.log(`[Sanitize] Removed non-English/Hindi characters: "${text}" → "${sanitized}"`);
  }
  
  return sanitized;
}

export function useHandleSessionHistory() {
  const {
    transcriptItems,
    addTranscriptBreadcrumb,
    addTranscriptMessage,
    updateTranscriptMessage,
    updateTranscriptItem,
  } = useTranscript();

  const { logServerEvent } = useEvent();

  /* ----------------------- helpers ------------------------- */

  const extractMessageText = (content: any[] = []): string => {
    if (!Array.isArray(content)) return "";

    const rawText = content
      .map((c) => {
        if (!c || typeof c !== "object") return "";
        if (c.type === "input_text") return c.text ?? "";
        if (c.type === "audio") return c.transcript ?? "";
        return "";
      })
      .filter(Boolean)
      .join("\n");
    
    // Sanitize to only English and Hindi characters
    return sanitizeToEnglishHindi(rawText);
  };

  const extractFunctionCallByName = (name: string, content: any[] = []): any => {
    if (!Array.isArray(content)) return undefined;
    return content.find((c: any) => c.type === 'function_call' && c.name === name);
  };

  const maybeParseJson = (val: any) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        console.warn('Failed to parse JSON:', val);
        return val;
      }
    }
    return val;
  };

  const extractLastAssistantMessage = (history: any[] = []): any => {
    if (!Array.isArray(history)) return undefined;
    return history.reverse().find((c: any) => c.type === 'message' && c.role === 'assistant');
  };

  const extractModeration = (obj: any) => {
    if ('moderationCategory' in obj) return obj;
    if ('outputInfo' in obj) return extractModeration(obj.outputInfo);
    if ('output' in obj) return extractModeration(obj.output);
    if ('result' in obj) return extractModeration(obj.result);
  };

  // Temporary helper until the guardrail_tripped event includes the itemId in the next version of the SDK
  const sketchilyDetectGuardrailMessage = (text: string) => {
    return text.match(/Failure Details: (\{.*?\})/)?.[1];
  };

  /* ----------------------- event handlers ------------------------- */

  function handleAgentToolStart(item: any) {
    // Extract function call info from the event item
    const functionCall = item?.functionCall || item?.function_call || item;
    const details = item?.details || item;
    
    if (!functionCall || !functionCall.name) {
      console.warn('[handleAgentToolStart] functionCall is undefined or missing name:', functionCall);
      return;
    }
    const lastFunctionCall = extractFunctionCallByName(functionCall.name, details?.context?.history);
    const function_name = lastFunctionCall?.name || functionCall.name;
    const function_args = lastFunctionCall?.arguments || functionCall.arguments;

    addTranscriptBreadcrumb(
      `function call: ${function_name}`,
      function_args
    );    
  }
  function handleAgentToolEnd(item: any) {
    // Extract function call info from the event item
    const functionCall = item?.functionCall || item?.function_call || item;
    const details = item?.details || item;
    const result = item?.result || item?.output;
    
    if (!functionCall || !functionCall.name) {
      console.warn('[handleAgentToolEnd] functionCall is undefined or missing name:', functionCall);
      return;
    }
    const lastFunctionCall = extractFunctionCallByName(functionCall.name, details?.context?.history);
    addTranscriptBreadcrumb(
      `function call result: ${lastFunctionCall?.name || functionCall.name}`,
      maybeParseJson(result)
    );
  }

  async function handleHistoryAdded(item: any) {
    console.log("[handleHistoryAdded] ", item);
    
    // Check if this is an agent change (look for agent property)
    if (item.agent) {
      console.log("🔄 AGENT DETECTED IN HISTORY:", item.agent);
      console.log("🔄 Agent name:", item.agent.name);
    }
    
    if (!item || item.type !== 'message') return;

    const { itemId, role, content = [] } = item;
    if (itemId && role) {
      const isUser = role === "user";
      let text = extractMessageText(content);

      if (isUser && !text) {
        text = "[Transcribing...]";
      }

      // If the guardrail has been tripped, this message is a message that gets sent to the 
      // assistant to correct it, so we add it as a breadcrumb instead of a message.
      const guardrailMessage = sketchilyDetectGuardrailMessage(text);
      if (guardrailMessage) {
        const failureDetails = JSON.parse(guardrailMessage);
        addTranscriptBreadcrumb('Output Guardrail Active', { details: failureDetails });
      } else {
        await addTranscriptMessage(itemId, role, text);
      }
    }
  }

  async function handleHistoryUpdated(items: any[]) {
    console.log("[handleHistoryUpdated] ", items);
    items.forEach(async (item: any) => {
      if (!item || item.type !== 'message') return;

      const { itemId, content = [] } = item;

      const text = extractMessageText(content);

      if (text) {
        await updateTranscriptMessage(itemId, text, false);
      }
    });
  }

  async function handleTranscriptionDelta(item: any) {
    const itemId = item.item_id;
    const deltaText = item.delta || "";
    if (itemId) {
      // Sanitize delta text to only English and Hindi
      const sanitizedDelta = sanitizeToEnglishHindi(deltaText);
      await updateTranscriptMessage(itemId, sanitizedDelta, true);
    }
  }

  async function handleTranscriptionCompleted(item: any) {
    // History updates don't reliably end in a completed item, 
    // so we need to handle finishing up when the transcription is completed.
    const itemId = item.item_id;
    const rawTranscript = item.transcript;
    
    // Sanitize and handle empty/inaudible transcripts
    let finalTranscript: string;
    if (!rawTranscript || rawTranscript === "\n") {
      finalTranscript = "[inaudible]";
    } else {
      // Sanitize to only English and Hindi characters
      finalTranscript = sanitizeToEnglishHindi(rawTranscript);
      // If sanitization removed everything meaningful, mark as inaudible
      if (!finalTranscript.trim()) {
        finalTranscript = "[inaudible]";
      }
    }
    
    if (itemId) {
      console.log(`[DEBUG] handleTranscriptionCompleted: finalTranscript="${finalTranscript}"`);
      await updateTranscriptMessage(itemId, finalTranscript, false);
      // Use the ref to get the latest transcriptItems
      const transcriptItem = transcriptItems.find((i) => i.itemId === itemId);
      updateTranscriptItem(itemId, { status: 'DONE' });

      // If guardrailResult still pending, mark PASS.
      if (transcriptItem?.guardrailResult?.status === 'IN_PROGRESS') {
        updateTranscriptItem(itemId, {
          guardrailResult: {
            status: 'DONE',
            category: 'NONE',
            rationale: '',
          },
        });
      }
    }
  }

  function handleGuardrailTripped(details: any, _agent: any, guardrail: any) {
    console.log("[guardrail tripped]", details, _agent, guardrail);
    const moderation = extractModeration(guardrail.result.output.outputInfo);
    logServerEvent({ type: 'guardrail_tripped', payload: moderation });

    // find the last assistant message in details.context.history
    const lastAssistant = extractLastAssistantMessage(details?.context?.history);

    if (lastAssistant && moderation) {
      const category = moderation.moderationCategory ?? 'NONE';
      const rationale = moderation.moderationRationale ?? '';
      const offendingText: string | undefined = moderation?.testText;

      updateTranscriptItem(lastAssistant.itemId, {
        guardrailResult: {
          status: 'DONE',
          category,
          rationale,
          testText: offendingText,
        },
      });
    }
  }

  const handlersRef = useRef({
    handleAgentToolStart,
    handleAgentToolEnd,
    handleHistoryUpdated,
    handleHistoryAdded,
    handleTranscriptionDelta,
    handleTranscriptionCompleted,
    handleGuardrailTripped,
  });

  return handlersRef;
}