import { type RequestConfig, type HttpResponse } from "../http/HttpClient";
import { ErrorType } from "../utils/errorHandler";
import { type ServiceError } from "../types/errorTypes";

export class AuthInterceptor {
  private getAuthToken?: () => string;

  constructor(getAuthToken?: () => string) {
    this.getAuthToken = getAuthToken;
  }

  async onRequest(config: RequestConfig): Promise<RequestConfig> {
    if (this.getAuthToken) {
      const token = this.getAuthToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }
    return config;
  }
}

export class LoggingInterceptor {
  private enableLogging: boolean;

  constructor(enableLogging: boolean = import.meta.env.DEV) {
    this.enableLogging = enableLogging;
  }

  async onRequest(config: RequestConfig): Promise<RequestConfig> {
    if (this.enableLogging) {
      console.log(`HTTP Request: ${config.method} ${config.url}`, {
        headers: config.headers,
        body: config.body,
      });
    }
    return config;
  }

  async onResponse<T>(response: HttpResponse<T>): Promise<HttpResponse<T>> {
    if (this.enableLogging) {
      console.log(`HTTP Response: ${response.status} ${response.statusText}`, {
        data: response.data,
        headers: response.headers,
      });
    }
    return response;
  }

  async onError(error: ServiceError): Promise<ServiceError> {
    if (this.enableLogging) {
      console.error(`HTTP Error: ${error.type}`, {
        message: error.message,
        service: error.service,
        context: error.context,
        originalError: error.originalError,
      });
    }
    return error;
  }
}

export class ErrorHandlingInterceptor {
  async onResponse<T>(response: HttpResponse<T>): Promise<HttpResponse<T>> {
    if (response.data && typeof response.data === "object") {
      const data = response.data as Record<string, unknown>;

      if (data.ServiceExceptionReport) {
        const errorReport = data.ServiceExceptionReport as Record<
          string,
          unknown
        >;
        const serviceException = errorReport.ServiceException as Record<
          string,
          unknown
        >;

        throw {
          type: ErrorType.SERVER_ERROR,
          message: `WMS Error: ${serviceException.message || "Unknown error"}`,
          service: "WMS" as const,
          timestamp: new Date().toISOString(),
          context: {
            url: response.headers["x-request-url"] || "unknown",
            wmsError: serviceException,
          },
          layerName: "unknown",
        } as ServiceError;
      }

      if (data.ExceptionReport) {
        const errorReport = data.ExceptionReport as Record<string, unknown>;
        const exception = errorReport.Exception as Record<string, unknown>;

        throw {
          type: ErrorType.SERVER_ERROR,
          message: `WFS Error: ${exception.ExceptionText || "Unknown error"}`,
          service: "WFS" as const,
          timestamp: new Date().toISOString(),
          context: {
            url: response.headers["x-request-url"] || "unknown",
            wfsError: exception,
          },
          layerName: "unknown",
          coordinates: { lat: 0, lng: 0 },
        } as ServiceError;
      }
    }

    return response;
  }

  async onError(error: ServiceError): Promise<ServiceError> {
    const enhancedError = { ...error };

    if (
      error.type === ErrorType.NETWORK_ERROR ||
      error.type === ErrorType.TIMEOUT_ERROR
    ) {
      enhancedError.context = {
        ...enhancedError.context,
        retryable: true,
        retryAfter: 5000,
      };
    }

    if (error.type === ErrorType.AUTHENTICATION_ERROR) {
      enhancedError.message = "Ошибка авторизации. Проверьте учетные данные.";
    } else if (error.type === ErrorType.VALIDATION_ERROR) {
      enhancedError.message =
        "Ошибка валидации данных. Проверьте параметры запроса.";
    }

    return enhancedError;
  }
}

export class PerformanceInterceptor {
  private requestTimes = new Map<string, number>();

  async onRequest(config: RequestConfig): Promise<RequestConfig> {
    const requestId = `${config.method}:${config.url}`;
    this.requestTimes.set(requestId, Date.now());
    return config;
  }

  async onResponse<T>(response: HttpResponse<T>): Promise<HttpResponse<T>> {
    const requestId = `${response.headers["x-request-method"] || "GET"}:${
      response.headers["x-request-url"] || "unknown"
    }`;
    const startTime = this.requestTimes.get(requestId);

    if (startTime) {
      const duration = Date.now() - startTime;
      this.requestTimes.delete(requestId);

      if (import.meta.env.DEV) {
        console.log(`Request duration: ${duration}ms for ${requestId}`);
      }

      response.headers["x-response-time"] = duration.toString();
    }

    return response;
  }

  async onError(error: ServiceError): Promise<ServiceError> {
    this.requestTimes.clear();
    return error;
  }
}

export class ContentTypeInterceptor {
  async onRequest(config: RequestConfig): Promise<RequestConfig> {
    if (config.body && !config.headers?.["Content-Type"]) {
      config.headers = {
        ...config.headers,
        "Content-Type": "application/json",
      };
    }

    if (!config.headers?.["Accept"]) {
      config.headers = {
        ...config.headers,
        Accept: "application/json, text/plain, */*",
      };
    }

    return config;
  }
}

export class InterceptorFactory {
  static createDefaultInterceptors() {
    return {
      request: [
        new ContentTypeInterceptor(),
        new LoggingInterceptor(),
        new PerformanceInterceptor(),
      ],
      response: [
        new LoggingInterceptor(),
        new PerformanceInterceptor(),
        new ErrorHandlingInterceptor(),
      ],
    };
  }
}
