import { ErrorType } from "../utils/errorHandler";
import {
  type WMSError,
  type WMSValidationError,
  type WMSConnectionError,
  createWMSError,
} from "../types/errorTypes";

export interface WMSConfig {
  baseUrl: string;
  layerName: string;
  version?: string;
  format?: string;
  transparent?: boolean;
  crs?: string;
}

export type { WMSError, WMSValidationError, WMSConnectionError };

export const validateWMSConfig = (
  config: Partial<WMSConfig>
): WMSValidationError | null => {
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
};

export const getWMSUrl = (layerName: string): string | WMSValidationError => {
  const config: Partial<WMSConfig> = {
    baseUrl: import.meta.env.VITE_WMS_BASE_URL,
    layerName,
    version: "1.3.0",
    format: "image/png",
    transparent: true,
    crs: "EPSG:4326",
  };

  const validationError = validateWMSConfig(config);
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
};

export const testWMSConnection = async (
  layerName: string
): Promise<boolean | WMSConnectionError> => {
  try {
    const urlOrError = getWMSUrl(layerName);

    if (typeof urlOrError !== "string") {
      return false;
    }

    const testParams = new URLSearchParams({
      bbox: "-180,-90,180,90",
      width: "1",
      height: "1",
    });

    const testUrl = `${urlOrError}&${testParams.toString()}`;

    const response = await fetch(testUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return createWMSError(
        ErrorType.SERVER_ERROR,
        `WMS сервер вернул ошибку: ${response.status} ${response.statusText}`,
        layerName,
        undefined,
        new Error(`HTTP ${response.status}`)
      ) as WMSConnectionError;
    }

    return response.ok;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "TimeoutError" || error.message.includes("timeout")) {
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
};
