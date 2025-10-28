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
      console.error("WMS сервис не настроен:");
      console.error(
        "   - Переменная VITE_WMS_BASE_URL не найдена в .env файле"
      );
      console.error(
        "   - Проверьте файл .env и добавьте: VITE_WMS_BASE_URL=https://your-wms-server.com"
      );
      console.error(
        "   - Перезапустите сервер разработки после изменения .env"
      );

      return createWMSError(
        ErrorType.VALIDATION_ERROR,
        "WMS URL не настроен. Проверьте переменную окружения VITE_WMS_BASE_URL.",
        config.layerName || "unknown",
        config
      ) as WMSValidationError;
    }

    if (!config.layerName) {
      console.error("WMS слой не указан:");
      console.error(
        "   - Переменная VITE_DEFAULT_LAYER_NAME не найдена в .env файле"
      );
      console.error(
        "   - Проверьте файл .env и добавьте: VITE_DEFAULT_LAYER_NAME=your-layer-name"
      );

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
      console.error("WMS URL некорректен:");
      console.error(`   - URL: ${config.baseUrl}`);
      console.error("   - Проверьте формат URL в переменной VITE_WMS_BASE_URL");

      return createWMSError(
        ErrorType.VALIDATION_ERROR,
        "Некорректный URL для WMS сервиса.",
        config.layerName,
        config
      ) as WMSValidationError;
    }

    console.log("WMS сервис настроен:");
    console.log(`   - URL: ${config.baseUrl}`);
    console.log(`   - Слой: ${config.layerName}`);

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
      console.log("Тестирование WMS соединения...");
      const urlOrError = this.getWMSUrl(layerName);

      if (typeof urlOrError !== "string") {
        console.error("WMS соединение не удалось - ошибка конфигурации");
        return false;
      }

      console.log("Проверка доступности WMS сервера...");
      const isConnected = await this.repository.testConnection(layerName);

      if (!isConnected) {
        console.error("WMS сервер недоступен:");
        console.error("   - Проверьте URL сервера в VITE_WMS_BASE_URL");
        console.error(
          "   - Проверьте логин/пароль в VITE_WMS_USERNAME/VITE_WMS_PASSWORD"
        );
        console.error("   - Убедитесь что сервер работает и доступен");

        return createWMSError(
          ErrorType.SERVER_ERROR,
          "WMS сервер недоступен или вернул ошибку",
          layerName,
          undefined,
          new Error("Connection test failed")
        ) as WMSConnectionError;
      }

      console.log("WMS сервер доступен и отвечает");
      return true;
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.name === "TimeoutError" ||
          error.message.includes("timeout")
        ) {
          console.error("WMS сервер не отвечает (таймаут):");
          console.error("   - Сервер слишком медленно отвечает");
          console.error("   - Проверьте стабильность интернет соединения");

          return createWMSError(
            ErrorType.TIMEOUT_ERROR,
            "Превышено время ожидания ответа от WMS сервера",
            layerName,
            undefined,
            error
          ) as WMSConnectionError;
        }

        console.error("Ошибка сети при подключении к WMS:");
        console.error(`   - Ошибка: ${error.message}`);
        console.error("   - Проверьте URL сервера и интернет соединение");

        return createWMSError(
          ErrorType.NETWORK_ERROR,
          "Ошибка сети при подключении к WMS серверу",
          layerName,
          undefined,
          error
        ) as WMSConnectionError;
      }

      console.error("Неизвестная ошибка WMS:");
      console.error(`   - Ошибка: ${String(error)}`);

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
