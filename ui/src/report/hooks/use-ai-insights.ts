import { useState, useCallback, useRef } from 'react';
import { generateSectionInsight } from '../api/grok-service';
import type { AiInsight, SectionId } from '../types';

type InsightMap = Partial<Record<SectionId, AiInsight>>;
const LOADING: AiInsight = { summary: '', suggestion: '', riskLevel: 'info', isLoading: true, error: null };

export function useAiInsights() {
  const [insights, setInsights] = useState<InsightMap>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  /** Incremented on every new generateAllInsights call; stale runs check this to bail out */
  const generationIdRef = useRef(0);

  const generateInsight = useCallback(async (sectionId: SectionId, sectionTitle: string, data: Record<string, unknown>) => {
    setInsights(p => ({ ...p, [sectionId]: LOADING }));
    const insight = await generateSectionInsight(sectionId, sectionTitle, data);
    setInsights(p => ({ ...p, [sectionId]: insight }));
  }, []);

  const generateAllInsights = useCallback(async (sections: Array<{ id: SectionId; title: string; data: Record<string, unknown> }>) => {
    const currentId = ++generationIdRef.current;
    setIsGenerating(true);
    setProgress(0);
    setTotal(sections.length);
    setInsights(p => { const n = { ...p }; for (const s of sections) n[s.id] = LOADING; return n; });
    
    let completed = 0;
    for (const s of sections) {
      // Bail out if a newer generation was started (race condition guard)
      if (generationIdRef.current !== currentId) return;
      const insight = await generateSectionInsight(s.id, s.title, s.data);
      // Check again after await in case a new generation started while this was in-flight
      if (generationIdRef.current !== currentId) return;
      setInsights(p => ({ ...p, [s.id]: insight }));
      completed++;
      setProgress(completed);
    }
    // Only mark done if this is still the active generation
    if (generationIdRef.current === currentId) {
      setIsGenerating(false);
    }
  }, []);

  const clearInsight = useCallback((id: SectionId) => setInsights(p => { const n = { ...p }; delete n[id]; return n; }), []);
  const clearAll = useCallback(() => {
    // Cancel any in-progress generation
    generationIdRef.current++;
    setInsights({});
    setIsGenerating(false);
    setProgress(0);
    setTotal(0);
  }, []);

  return { insights, setInsights, isGenerating, setIsGenerating, progress, setProgress, total, setTotal, generateInsight, generateAllInsights, clearInsight, clearAll };
}
