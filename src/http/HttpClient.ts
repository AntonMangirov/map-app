import { ErrorType } from "../utils/errorHandler";
import { type ServiceError } from "../types/errorTypes";

export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

export interface RequestConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "HEAD";
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface RequestInterceptor {
  onRequest(config: RequestConfig): RequestConfig | Promise<RequestConfig>;
}

export interface ResponseInterceptor {
  onResponse<T>(
    response: HttpResponse<T>
  ): HttpResponse<T> | Promise<HttpResponse<T>>;
  onError(error: ServiceError): ServiceError | Promise<ServiceError>;
}

export class InterceptorManager {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  async processRequest(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config;

    for (const interceptor of this.requestInterceptors) {
      processedConfig = await interceptor.onRequest(processedConfig);
    }

    return processedConfig;
  }

  async processResponse<T>(
    response: HttpResponse<T>
  ): Promise<HttpResponse<T>> {
    let processedResponse = response;

    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor.onResponse(processedResponse);
    }

    return processedResponse;
  }

  async processError(error: ServiceError): Promise<ServiceError> {
    let processedError = error;

    for (const interceptor of this.responseInterceptors) {
      processedError = await interceptor.onError(processedError);
    }

    return processedError;
  }
}

export class HttpClient {
  private config: HttpClientConfig;
  private interceptors: InterceptorManager;

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      timeout: 10000,
      retryCount: 3,
      retryDelay: 1000,
      ...config,
    };
    this.interceptors = new InterceptorManager();
  }

  get interceptorsManager(): InterceptorManager {
    return this.interceptors;
  }

  async request<T = unknown>(config: RequestConfig): Promise<HttpResponse<T>> {
    try {
      const processedConfig = await this.interceptors.processRequest({
        ...config,
        timeout: config.timeout || this.config.timeout,
      });

      const response = await this.executeWithRetry(processedConfig);

      return (await this.interceptors.processResponse(
        response
      )) as HttpResponse<T>;
    } catch (error) {
      const serviceError = this.handleError(error, config);
      const processedError = await this.interceptors.processError(serviceError);
      throw processedError;
    }
  }

  private async executeWithRetry<T>(
    config: RequestConfig
  ): Promise<HttpResponse<T>> {
    const maxRetries = config.retryCount || this.config.retryCount || 3;
    const retryDelay = config.retryDelay || this.config.retryDelay || 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeRequest<T>(config);
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        if (this.isRetryableError(error)) {
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
          continue;
        }

        throw error;
      }
    }

    throw new Error("Max retries exceeded");
  }

  private async executeRequest<T>(
    config: RequestConfig
  ): Promise<HttpResponse<T>> {
    const url = this.buildUrl(config.url);
    const controller = new AbortController();

    const timeoutId = setTimeout(
      () => controller.abort(),
      config.timeout || this.config.timeout
    );

    try {
      const response = await fetch(url, {
        method: config.method,
        headers: config.headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let data: T;
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else if (contentType?.includes("text/")) {
        data = (await response.text()) as T;
      } else {
        data = (await response.arrayBuffer()) as T;
      }

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private buildUrl(url: string): string {
    if (url.startsWith("http")) {
      return url;
    }

    const baseURL = this.config.baseURL || "";
    return `${baseURL}${url.startsWith("/") ? url : `/${url}`}`;
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        return true;
      }

      if (error.name === "AbortError" || error.message.includes("timeout")) {
        return true;
      }

      if (error.message.includes("HTTP 5")) {
        return true;
      }
    }

    return false;
  }

  private handleError(error: unknown, config: RequestConfig): ServiceError {
    if (error instanceof Error) {
      if (error.name === "AbortError" || error.message.includes("timeout")) {
        return {
          type: ErrorType.TIMEOUT_ERROR,
          message: `Request timeout: ${config.url}`,
          service: "GENERAL",
          timestamp: new Date().toISOString(),
          originalError: error,
          context: { url: config.url, method: config.method },
        } as ServiceError;
      }

      if (error.message.includes("HTTP 4")) {
        return {
          type: ErrorType.VALIDATION_ERROR,
          message: `Client error: ${error.message}`,
          service: "GENERAL",
          timestamp: new Date().toISOString(),
          originalError: error,
          context: { url: config.url, method: config.method },
        } as ServiceError;
      }

      if (error.message.includes("HTTP 5")) {
        return {
          type: ErrorType.SERVER_ERROR,
          message: `Server error: ${error.message}`,
          service: "GENERAL",
          timestamp: new Date().toISOString(),
          originalError: error,
          context: { url: config.url, method: config.method },
        } as ServiceError;
      }

      return {
        type: ErrorType.NETWORK_ERROR,
        message: `Network error: ${error.message}`,
        service: "GENERAL",
        timestamp: new Date().toISOString(),
        originalError: error,
        context: { url: config.url, method: config.method },
      } as ServiceError;
    }

    return {
      type: ErrorType.UNKNOWN_ERROR,
      message: "Unknown error occurred",
      service: "GENERAL",
      timestamp: new Date().toISOString(),
      originalError: error instanceof Error ? error : new Error(String(error)),
      context: { url: config.url, method: config.method },
    } as ServiceError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async get<T>(
    url: string,
    config?: Partial<RequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: "GET" });
  }

  async post<T>(
    url: string,
    body?: unknown,
    config?: Partial<RequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: "POST", body });
  }

  async put<T>(
    url: string,
    body?: unknown,
    config?: Partial<RequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: "PUT", body });
  }

  async delete<T>(
    url: string,
    config?: Partial<RequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: "DELETE" });
  }

  async head<T>(
    url: string,
    config?: Partial<RequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: "HEAD" });
  }
}
