import React from "react";
import { V2EvaluationProvider } from "./contexts/V2EvaluationContext";
import SessionProvider from "./components/SessionProvider";

export const metadata = {
  title: "Mahindra HCE Evaluation v2.0",
  description: "Human Communication Excellence Assessment Platform for Mahindra",
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



