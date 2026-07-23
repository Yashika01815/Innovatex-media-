import { useCallback, useEffect, useState } from 'react';
import { qualificationApi } from '@/lib/qualificationApi';
import { settingsApi } from '@/lib/settingsApi';
import type { Qualification, RunQualificationInput } from '@/types/qualification';
import type { Lead } from '@/types/lead';

export interface UseQualificationResult {
  questions: string[];
  questionsLoading: boolean;
  run: (input: RunQualificationInput) => Promise<Qualification>;
  apply: (id: string) => Promise<{ qualification: Qualification; lead: Lead }>;
  override: (id: string, score: number) => Promise<Qualification>;
}

/**
 * useQualification -- this page is a single active session (pick lead,
 * answer questions, run, review, apply), not a paginated list view, so
 * unlike useLeads/usePipelineBoard/useBookings/useCalls this hook just
 * exposes the real discovery questions plus the three actions.
 */
export function useQualification(): UseQualificationResult {
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    settingsApi.getQualificationQuestions()
      .then((qs) => { if (!cancelled) setQuestions(qs); })
      .catch(() => { if (!cancelled) setQuestions([]); })
      .finally(() => { if (!cancelled) setQuestionsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const run = useCallback((input: RunQualificationInput) => qualificationApi.run(input), []);
  const apply = useCallback((id: string) => qualificationApi.apply(id), []);
  const override = useCallback((id: string, score: number) => qualificationApi.override(id, score), []);

  return { questions, questionsLoading, run, apply, override };
}