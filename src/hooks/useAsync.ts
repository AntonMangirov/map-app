import { useState, useCallback, useRef, useEffect } from "react";
import { ErrorHandler, type AppError } from "../utils/errorHandler";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
}

export interface UseAsyncOptions {
  immediate?: boolean;
  resetOnExecute?: boolean;
}

export interface UseAsyncReturn<T> extends AsyncState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
  setError: (error: AppError | null) => void;
}

export function useAsync<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseAsyncOptions = {}
): UseAsyncReturn<T> {
  const { immediate = false, resetOnExecute = true } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      if (!isMountedRef.current) return null;

      if (resetOnExecute) {
        setState((prev) => ({
          ...prev,
          loading: true,
          error: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          loading: true,
        }));
      }

      try {
        const result = await asyncFunction(...args);

        if (!isMountedRef.current) return null;

        setState({
          data: result,
          loading: false,
          error: null,
        });

        return result;
      } catch (error) {
        if (!isMountedRef.current) return null;

        const appError = ErrorHandler.handleFetchError(error, { args });

        setState((prev) => ({
          ...prev,
          loading: false,
          error: appError,
        }));

        return null;
      }
    },
    [asyncFunction, resetOnExecute]
  );

  const reset = useCallback(() => {
    if (!isMountedRef.current) return;

    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  const setData = useCallback((data: T | null) => {
    if (!isMountedRef.current) return;

    setState((prev) => ({
      ...prev,
      data,
    }));
  }, []);

  const setError = useCallback((error: AppError | null) => {
    if (!isMountedRef.current) return;

    setState((prev) => ({
      ...prev,
      error,
    }));
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
  };
}

export function useWFSQuery() {
  return useAsync(
    async (lat: number, lng: number, layerName: string) => {
      const { getFeatureByPoint } = await import("../services/wfsService");
      const result = await getFeatureByPoint(lat, lng, layerName);

      if ("type" in result && result.type) {
        throw new Error((result as any).message);
      }

      return result;
    },
    { immediate: false, resetOnExecute: true }
  );
}

export function useWMSConnection() {
  return useAsync(
    async (layerName: string) => {
      const { testWMSConnection } = await import("../services/wmsService");
      return await testWMSConnection(layerName);
    },
    { immediate: false, resetOnExecute: true }
  );
}
