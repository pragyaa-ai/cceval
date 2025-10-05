import React, { Suspense } from "react";
import { LanguageProvider } from "@/app/contexts/LanguageContext";
import { TranscriptProvider } from "@/app/contexts/TranscriptContext";
import { EventProvider } from "@/app/contexts/EventContext";
import { DataCollectionProvider } from "@/app/contexts/DataCollectionContext";
import { SalesDataProvider } from "@/app/contexts/SalesDataContext";
import { ConsultationDataProvider } from "@/app/contexts/ConsultationDataContext";
import { VoiceAnalysisProvider } from "@/app/contexts/VoiceAnalysisContext";
import { EvaluationSessionProvider } from "@/app/contexts/EvaluationSessionContext";
import App from "@/app/App";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LanguageProvider>
        <DataCollectionProvider>
          <SalesDataProvider>
            <ConsultationDataProvider>
              <TranscriptProvider>
                <EventProvider>
                  <VoiceAnalysisProvider>
                    <EvaluationSessionProvider>
                      <App />
                    </EvaluationSessionProvider>
                  </VoiceAnalysisProvider>
                </EventProvider>
              </TranscriptProvider>
            </ConsultationDataProvider>
          </SalesDataProvider>
        </DataCollectionProvider>
      </LanguageProvider>
    </Suspense>
  );
}
