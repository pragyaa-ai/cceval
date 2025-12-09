import React from "react";
import { V2EvaluationProvider } from "./contexts/V2EvaluationContext";
import SessionProvider from "./components/SessionProvider";

export const metadata = {
  title: "CCEval - Call Center Evaluation Platform",
  description: "Human Communication Excellence Assessment Platform by Pragyaa.ai",
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



