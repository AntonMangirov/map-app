import { ErrorType, type AppError } from "../utils/errorHandler";

export { ErrorType };

export interface BaseServiceError extends AppError {
  service: "WMS" | "WFS" | "GENERAL";
  timestamp: string;
}

export interface WMSError extends BaseServiceError {
  service: "WMS";
  layerName: string;
  config?: {
    baseUrl?: string;
    version?: string;
    format?: string;
    crs?: string;
  };
}

export interface WMSValidationError extends WMSError {
  validationField: "baseUrl" | "layerName" | "urlFormat";
}

export interface WMSConnectionError extends WMSError {
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
}

export interface WFSError extends BaseServiceError {
  service: "WFS";
  layerName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  requestParams?: {
    bbox?: string;
    outputFormat?: string;
    srsname?: string;
  };
}

export interface WFSValidationError extends WFSError {
  validationField: "baseUrl" | "layerName" | "coordinates" | "responseFormat";
}

export interface WFSAuthenticationError extends WFSError {
  credentials?: {
    username?: string;
    hasPassword: boolean;
  };
}

export interface WFSResponseError extends WFSError {
  responseData?: unknown;
  expectedFormat?: string;
}

export interface NetworkError extends BaseServiceError {
  service: "GENERAL";
  networkDetails?: {
    url?: string;
    method?: string;
    timeout?: number;
  };
}

export interface TimeoutError extends BaseServiceError {
  service: "GENERAL";
  timeoutDetails?: {
    duration: number;
    operation: string;
  };
}

export type ServiceError = WMSError | WFSError | NetworkError | TimeoutError;

export type WMSSpecificError = WMSValidationError | WMSConnectionError;
export type WFSSpecificError =
  | WFSValidationError
  | WFSAuthenticationError
  | WFSResponseError;

export function isWMSError(error: ServiceError): error is WMSError {
  return error.service === "WMS";
}

export function isWFSError(error: ServiceError): error is WFSError {
  return error.service === "WFS";
}

export function isWMSValidationError(
  error: ServiceError
): error is WMSValidationError {
  return isWMSError(error) && error.type === ErrorType.VALIDATION_ERROR;
}

export function isWMSConnectionError(
  error: ServiceError
): error is WMSConnectionError {
  return (
    isWMSError(error) &&
    (error.type === ErrorType.NETWORK_ERROR ||
      error.type === ErrorType.TIMEOUT_ERROR ||
      error.type === ErrorType.SERVER_ERROR)
  );
}

export function isWFSValidationError(
  error: ServiceError
): error is WFSValidationError {
  return isWFSError(error) && error.type === ErrorType.VALIDATION_ERROR;
}

export function isWFSAuthenticationError(
  error: ServiceError
): error is WFSAuthenticationError {
  return isWFSError(error) && error.type === ErrorType.AUTHENTICATION_ERROR;
}

export function isWFSResponseError(
  error: ServiceError
): error is WFSResponseError {
  return (
    isWFSError(error) &&
    (error.type === ErrorType.VALIDATION_ERROR ||
      error.type === ErrorType.SERVER_ERROR)
  );
}

export function isNetworkError(error: ServiceError): error is NetworkError {
  return error.service === "GENERAL" && error.type === ErrorType.NETWORK_ERROR;
}

export function isTimeoutError(error: ServiceError): error is TimeoutError {
  return error.service === "GENERAL" && error.type === ErrorType.TIMEOUT_ERROR;
}

export const ErrorSeverity = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

export type ErrorSeverity = (typeof ErrorSeverity)[keyof typeof ErrorSeverity];

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp: string;
  stackTrace?: string;
  additionalData?: Record<string, unknown>;
}

export interface ContextualError {
  type: ErrorType;
  message: string;
  service: "WMS" | "WFS" | "GENERAL";
  timestamp: string;
  originalError?: Error;
  statusCode?: number;
  context: ErrorContext;
  severity: ErrorSeverity;
  retryable: boolean;
  userMessage: string;
  technicalMessage: string;
}

export interface ErrorCategory {
  category: "CONFIGURATION" | "NETWORK" | "AUTHENTICATION" | "DATA" | "UNKNOWN";
  displayName: string;
  description: string;
  suggestedActions: string[];
}

export function createWMSError(
  type: ErrorType,
  message: string,
  layerName: string,
  config?: WMSError["config"],
  originalError?: Error
): WMSError {
  return {
    type,
    message,
    service: "WMS",
    layerName,
    config,
    originalError,
    timestamp: new Date().toISOString(),
  };
}

export function createWFSError(
  type: ErrorType,
  message: string,
  layerName: string,
  coordinates: { lat: number; lng: number },
  requestParams?: WFSError["requestParams"],
  originalError?: Error
): WFSError {
  return {
    type,
    message,
    service: "WFS",
    layerName,
    coordinates,
    requestParams,
    originalError,
    timestamp: new Date().toISOString(),
  };
}

export function createNetworkError(
  message: string,
  networkDetails?: NetworkError["networkDetails"],
  originalError?: Error
): NetworkError {
  return {
    type: ErrorType.NETWORK_ERROR,
    message,
    service: "GENERAL",
    networkDetails,
    originalError,
    timestamp: new Date().toISOString(),
  };
}

export function createTimeoutError(
  message: string,
  timeoutDetails?: TimeoutError["timeoutDetails"],
  originalError?: Error
): TimeoutError {
  return {
    type: ErrorType.TIMEOUT_ERROR,
    message,
    service: "GENERAL",
    timeoutDetails,
    originalError,
    timestamp: new Date().toISOString(),
  };
}
