import { useState } from "react";
import { type ServiceError } from "../types/errorTypes";

export const useErrorDisplay = (initialError?: ServiceError) => {
  const [error, setError] = useState<ServiceError | null>(initialError || null);
  const [dismissed, setDismissed] = useState(false);

  const showError = (newError: ServiceError) => {
    setError(newError);
    setDismissed(false);
  };

  const dismissError = () => {
    setDismissed(true);
  };

  const clearError = () => {
    setError(null);
    setDismissed(false);
  };

  return {
    error,
    dismissed,
    showError,
    dismissError,
    clearError,
  };
};
