'use client';

import { createContext, useContext } from 'react';

export const AutomationValidationErrorsContext = createContext<Map<string, string>>(new Map());

export function useAutomationNodeValidation(nodeId: string) {
  const errors = useContext(AutomationValidationErrorsContext);
  return errors.get(nodeId);
}
