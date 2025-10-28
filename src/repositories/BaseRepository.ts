import {
  HttpClient,
  type RequestConfig,
  type HttpResponse,
} from "../http/HttpClient";
import { ErrorType } from "../utils/errorHandler";
import { type ServiceError } from "../types/errorTypes";

export abstract class AbstractRepository {
  protected httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  abstract getEndpoint(): string;

  protected async makeRequest<T>(
    path: string,
    config: Partial<RequestConfig> = {}
  ): Promise<HttpResponse<T>> {
    const url = `${this.getEndpoint()}${
      path.startsWith("/") ? path : `/${path}`
    }`;

    return this.httpClient.request<T>({
      url,
      method: "GET",
      ...config,
    });
  }

  protected async get<T>(
    path: string,
    config?: Partial<RequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.makeRequest<T>(path, { ...config, method: "GET" });
  }

  protected async post<T>(
    path: string,
    body?: unknown,
    config?: Partial<RequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.makeRequest<T>(path, { ...config, method: "POST", body });
  }

  protected async put<T>(
    path: string,
    body?: unknown,
    config?: Partial<RequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.makeRequest<T>(path, { ...config, method: "PUT", body });
  }

  protected async delete<T>(
    path: string,
    config?: Partial<RequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.makeRequest<T>(path, { ...config, method: "DELETE" });
  }

  protected async head<T>(
    path: string,
    config?: Partial<RequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.makeRequest<T>(path, { ...config, method: "HEAD" });
  }

  protected createServiceError(
    type: ErrorType,
    message: string,
    service: "WMS" | "WFS" | "GENERAL",
    originalError?: Error,
    context?: Record<string, unknown>
  ): ServiceError {
    return {
      type,
      message,
      service,
      timestamp: new Date().toISOString(),
      originalError,
      context,
    } as ServiceError;
  }
}

export class WMSRepository extends AbstractRepository {
  constructor(httpClient: HttpClient) {
    super(httpClient);
  }

  getEndpoint(): string {
    return import.meta.env.VITE_WMS_BASE_URL || "";
  }

  async getCapabilities(): Promise<HttpResponse<unknown>> {
    try {
      return await this.get("/capabilities", {
        headers: {
          Accept: "application/xml",
        },
      });
    } catch (error) {
      throw this.createServiceError(
        ErrorType.NETWORK_ERROR,
        "Failed to get WMS capabilities",
        "WMS",
        error instanceof Error ? error : new Error(String(error)),
        { operation: "getCapabilities" }
      );
    }
  }

  async getMap(params: {
    layers: string;
    bbox: string;
    width: number;
    height: number;
    format?: string;
    srs?: string;
    version?: string;
  }): Promise<HttpResponse<ArrayBuffer>> {
    try {
      const queryParams = new URLSearchParams({
        service: "WMS",
        version: params.version || "1.3.0",
        request: "GetMap",
        layers: params.layers,
        bbox: params.bbox,
        width: params.width.toString(),
        height: params.height.toString(),
        format: params.format || "image/png",
        transparent: "true",
        crs: params.srs || "EPSG:4326",
      });

      return await this.get(`/map?${queryParams.toString()}`, {
        headers: {
          Accept: params.format || "image/png",
        },
      });
    } catch (error) {
      throw this.createServiceError(
        ErrorType.NETWORK_ERROR,
        "Failed to get WMS map",
        "WMS",
        error instanceof Error ? error : new Error(String(error)),
        { operation: "getMap", params }
      );
    }
  }

  async testConnection(layerName: string): Promise<boolean> {
    try {
      const response = await this.getMap({
        layers: layerName,
        bbox: "-180,-90,180,90",
        width: 1,
        height: 1,
      });

      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export class WFSRepository extends AbstractRepository {
  constructor(httpClient: HttpClient) {
    super(httpClient);
  }

  getEndpoint(): string {
    return import.meta.env.VITE_WFS_BASE_URL || "";
  }

  async getCapabilities(): Promise<HttpResponse<unknown>> {
    try {
      return await this.get("/capabilities", {
        headers: {
          Accept: "application/xml",
        },
      });
    } catch (error) {
      throw this.createServiceError(
        ErrorType.NETWORK_ERROR,
        "Failed to get WFS capabilities",
        "WFS",
        error instanceof Error ? error : new Error(String(error)),
        { operation: "getCapabilities" }
      );
    }
  }

  async getFeature(params: {
    typeName: string;
    bbox: string;
    outputFormat?: string;
    srsname?: string;
    version?: string;
  }): Promise<HttpResponse<unknown>> {
    try {
      const queryParams = new URLSearchParams({
        service: "WFS",
        version: params.version || "1.1.0",
        request: "GetFeature",
        typeName: params.typeName,
        outputFormat: params.outputFormat || "application/json",
        bbox: params.bbox,
        srsname: params.srsname || "EPSG:4326",
      });

      return await this.get(`/feature?${queryParams.toString()}`, {
        headers: {
          Accept: params.outputFormat || "application/json",
          Authorization: this.getAuthHeader(),
        },
      });
    } catch (error) {
      throw this.createServiceError(
        ErrorType.NETWORK_ERROR,
        "Failed to get WFS feature",
        "WFS",
        error instanceof Error ? error : new Error(String(error)),
        { operation: "getFeature", params }
      );
    }
  }

  async getFeatureByPoint(
    lat: number,
    lng: number,
    layerName: string
  ): Promise<HttpResponse<unknown>> {
    try {
      const buffer = 0.001;
      const bbox = `${lng - buffer},${lat - buffer},${lng + buffer},${
        lat + buffer
      }`;

      return await this.getFeature({
        typeName: layerName,
        bbox,
        outputFormat: "application/json",
        srsname: "EPSG:4326",
      });
    } catch (error) {
      throw this.createServiceError(
        ErrorType.NETWORK_ERROR,
        "Failed to get WFS feature by point",
        "WFS",
        error instanceof Error ? error : new Error(String(error)),
        { operation: "getFeatureByPoint", lat, lng, layerName }
      );
    }
  }

  private getAuthHeader(): string {
    const username = import.meta.env.VITE_WFS_USERNAME || "mo";
    const password = import.meta.env.VITE_WFS_PASSWORD || "mo";
    return `Basic ${btoa(`${username}:${password}`)}`;
  }
}

export class RepositoryFactory {
  private static wmsRepository: WMSRepository;
  private static wfsRepository: WFSRepository;

  static getWMSRepository(): WMSRepository {
    if (!this.wmsRepository) {
      this.wmsRepository = new WMSRepository(new HttpClient());
    }
    return this.wmsRepository;
  }

  static getWFSRepository(): WFSRepository {
    if (!this.wfsRepository) {
      this.wfsRepository = new WFSRepository(new HttpClient());
    }
    return this.wfsRepository;
  }
}
