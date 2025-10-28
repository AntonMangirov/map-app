import { HttpClient } from "./HttpClient";
import { InterceptorFactory } from "./interceptors";

export interface HttpConfig {
  baseURL?: string;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  enableLogging?: boolean;
  enablePerformanceMonitoring?: boolean;
}

export class HttpClientFactory {
  static createClient(config: HttpConfig = {}): HttpClient {
    const {
      baseURL,
      timeout = 10000,
      retryCount = 3,
      retryDelay = 1000,
    } = config;

    const client = new HttpClient({
      baseURL,
      timeout,
      retryCount,
      retryDelay,
    });

    const interceptors = InterceptorFactory.createDefaultInterceptors();

    interceptors.request.forEach((interceptor) => {
      client.interceptorsManager.addRequestInterceptor(interceptor);
    });

    interceptors.response.forEach((interceptor) => {
      client.interceptorsManager.addResponseInterceptor(interceptor);
    });

    return client;
  }
}

export const initializeHttpClients = () => {
  const wmsClient = HttpClientFactory.createClient({
    baseURL: import.meta.env.VITE_WMS_BASE_URL,
    timeout: 15000,
    retryCount: 2,
    retryDelay: 2000,
  });

  const wfsClient = HttpClientFactory.createClient({
    baseURL: import.meta.env.VITE_WFS_BASE_URL,
    timeout: 10000,
    retryCount: 3,
    retryDelay: 1000,
  });

  return {
    wms: wmsClient,
    wfs: wfsClient,
  };
};

export const httpClients = initializeHttpClients();
