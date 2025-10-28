import { RepositoryFactory } from "../repositories/BaseRepository";
import { ErrorType } from "../utils/errorHandler";
import {
  type WMSError,
  type WMSValidationError,
  type WMSConnectionError,
  createWMSError,
} from "../types/errorTypes";

export type { WMSError, WMSValidationError, WMSConnectionError };

export interface WMSConfig {
  baseUrl: string;
  layerName: string;
  version?: string;
  format?: string;
  transparent?: boolean;
  crs?: string;
}

export class WMSService {
  private repository = RepositoryFactory.getWMSRepository();

  validateWMSConfig(config: Partial<WMSConfig>): WMSValidationError | null {
    if (!config.baseUrl) {
      return createWMSError(
        ErrorType.VALIDATION_ERROR,
        "WMS URL не настроен. Проверьте переменную окружения VITE_WMS_BASE_URL.",
        config.layerName || "unknown",
        config
      ) as WMSValidationError;
    }

    if (!config.layerName) {
      return createWMSError(
        ErrorType.VALIDATION_ERROR,
        "Название слоя не указано.",
        "unknown",
        config
      ) as WMSValidationError;
    }

    try {
      new URL(config.baseUrl);
    } catch {
      return createWMSError(
        ErrorType.VALIDATION_ERROR,
        "Некорректный URL для WMS сервиса.",
        config.layerName,
        config
      ) as WMSValidationError;
    }

    return null;
  }

  getWMSUrl(layerName: string): string | WMSValidationError {
    const config: Partial<WMSConfig> = {
      baseUrl: import.meta.env.VITE_WMS_BASE_URL,
      layerName,
      version: "1.3.0",
      format: "image/png",
      transparent: true,
      crs: "EPSG:4326",
    };

    const validationError = this.validateWMSConfig(config);
    if (validationError) {
      return validationError;
    }

    const params = new URLSearchParams({
      service: "WMS",
      version: config.version!,
      request: "GetMap",
      layers: config.layerName!,
      format: config.format!,
      transparent: config.transparent!.toString(),
      crs: config.crs!,
    });

    return `${config.baseUrl}?${params.toString()}`;
  }

  async testWMSConnection(
    layerName: string
  ): Promise<boolean | WMSConnectionError> {
    try {
      const urlOrError = this.getWMSUrl(layerName);

      if (typeof urlOrError !== "string") {
        return false;
      }

      const isConnected = await this.repository.testConnection(layerName);

      if (!isConnected) {
        return createWMSError(
          ErrorType.SERVER_ERROR,
          "WMS сервер недоступен или вернул ошибку",
          layerName,
          undefined,
          new Error("Connection test failed")
        ) as WMSConnectionError;
      }

      return true;
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.name === "TimeoutError" ||
          error.message.includes("timeout")
        ) {
          return createWMSError(
            ErrorType.TIMEOUT_ERROR,
            "Превышено время ожидания ответа от WMS сервера",
            layerName,
            undefined,
            error
          ) as WMSConnectionError;
        }

        return createWMSError(
          ErrorType.NETWORK_ERROR,
          "Ошибка сети при подключении к WMS серверу",
          layerName,
          undefined,
          error
        ) as WMSConnectionError;
      }

      return createWMSError(
        ErrorType.UNKNOWN_ERROR,
        "Неизвестная ошибка при тестировании WMS соединения",
        layerName,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      ) as WMSConnectionError;
    }
  }

  async getCapabilities(): Promise<unknown> {
    try {
      const response = await this.repository.getCapabilities();
      return response.data;
    } catch (error) {
      throw createWMSError(
        ErrorType.NETWORK_ERROR,
        "Не удалось получить capabilities WMS сервиса",
        "capabilities",
        undefined,
        error instanceof Error ? error : new Error(String(error))
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
  }): Promise<ArrayBuffer> {
    try {
      const response = await this.repository.getMap(params);
      return response.data;
    } catch (error) {
      throw createWMSError(
        ErrorType.NETWORK_ERROR,
        "Не удалось получить карту от WMS сервиса",
        params.layers,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}

const wmsService = new WMSService();

export const validateWMSConfig = wmsService.validateWMSConfig.bind(wmsService);
export const getWMSUrl = wmsService.getWMSUrl.bind(wmsService);
export const testWMSConnection = wmsService.testWMSConnection.bind(wmsService);

export { wmsService };
