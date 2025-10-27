import { useState, useCallback, useRef, useEffect } from "react";
import { ErrorHandler, type AppError } from "../utils/errorHandler";
import { type ServiceError } from "../types/errorTypes";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
}

export interface UseAsyncOptions {
  immediate?: boolean;
  resetOnExecute?: boolean;
  retryCount?: number;
  retryDelay?: number;
  retryCondition?: (error: AppError) => boolean;
}

export interface UseAsyncReturn<T> extends AsyncState<T> {
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
  setError: (error: AppError | null) => void;
}

export function useAsync<T>(
  asyncFunction: (...args: unknown[]) => Promise<T>,
  options: UseAsyncOptions = {}
): UseAsyncReturn<T> {
  const {
    immediate = false,
    resetOnExecute = true,
    retryCount = 3,
    retryDelay = 1000,
    retryCondition = (error) => ErrorHandler.shouldRetry(error),
  } = options;

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

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const executeWithRetry = useCallback(
    async (
      fn: (...args: unknown[]) => Promise<T>,
      args: unknown[],
      attempt: number = 1
    ): Promise<T> => {
      try {
        return await fn(...args);
      } catch (error) {
        const appError = ErrorHandler.handleFetchError(error, {
          args,
          attempt,
        });

        if (attempt < retryCount && retryCondition(appError)) {
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await sleep(delay);
          return executeWithRetry(fn, args, attempt + 1);
        }

        throw appError;
      }
    },
    [retryCount, retryDelay, retryCondition]
  );

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
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
        const result = await executeWithRetry(asyncFunction, args);

        if (!isMountedRef.current) return null;

        setState({
          data: result,
          loading: false,
          error: null,
        });

        return result;
      } catch (error) {
        if (!isMountedRef.current) return null;

        setState((prev) => ({
          ...prev,
          loading: false,
          error: error as AppError,
        }));

        return null;
      }
    },
    [asyncFunction, resetOnExecute, executeWithRetry]
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
    async (...args: unknown[]) => {
      const [lat, lng, layerName] = args as [number, number, string];
      const { getFeatureByPoint } = await import("../services/wfsService");
      const result = await getFeatureByPoint(lat, lng, layerName);

      if ("type" in result && result.type) {
        throw new Error((result as ServiceError).message);
      }

      return result;
    },
    {
      immediate: false,
      resetOnExecute: true,
      retryCount: 2,
      retryDelay: 1000,
      retryCondition: (error) =>
        error.type === "NETWORK_ERROR" || error.type === "TIMEOUT_ERROR",
    }
  );
}

export function useWMSConnection() {
  return useAsync(
    async (...args: unknown[]) => {
      const [layerName] = args as [string];
      const { testWMSConnection } = await import("../services/wmsService");
      return await testWMSConnection(layerName);
    },
    {
      immediate: false,
      resetOnExecute: true,
      retryCount: 1,
      retryDelay: 2000,
      retryCondition: (error) => error.type === "NETWORK_ERROR",
    }
  );
}
