import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

export interface GenerationUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
}

interface GenerationContextValue {
  usage: GenerationUsage | null;
  setUsage: Dispatch<SetStateAction<GenerationUsage | null>>;
}

const GenerationContext = createContext<GenerationContextValue | undefined>(
  undefined,
);

export function GenerationProvider({ children }: { children: ReactNode }) {
  const [usage, setUsage] = useState<GenerationUsage | null>(null);

  return (
    <GenerationContext.Provider value={{ usage, setUsage }}>
      {children}
    </GenerationContext.Provider>
  );
}

export function useGeneration() {
  const ctx = useContext(GenerationContext);
  if (!ctx) {
    throw new Error('useGeneration must be used within GenerationProvider');
  }
  return ctx;
}
