import React from "react";
import { V2EvaluationProvider } from "./contexts/V2EvaluationContext";
import SessionProvider from "./components/SessionProvider";

export const metadata = {
  title: "VoiceAgent Evaluations - HR Services Evaluation Platform",
  description: "AI-Powered Evaluation for Exit Interviews, New Hire Engagement & Continuous Engagement by Pragyaa.ai",
};

export default function V2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <V2EvaluationProvider>
        {children}
      </V2EvaluationProvider>
    </SessionProvider>
  );
}



