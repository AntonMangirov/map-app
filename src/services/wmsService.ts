import { ErrorHandler, ErrorType, type AppError } from "../utils/errorHandler";

export interface WMSConfig {
  baseUrl: string;
  layerName: string;
  version?: string;
  format?: string;
  transparent?: boolean;
  crs?: string;
}

export interface WMSError extends AppError {
  layerName: string;
  config: Partial<WMSConfig>;
}

export const validateWMSConfig = (
  config: Partial<WMSConfig>
): WMSError | null => {
  if (!config.baseUrl) {
    return ErrorHandler.createError(
      ErrorType.VALIDATION_ERROR,
      "WMS URL не настроен. Проверьте переменную окружения VITE_WMS_BASE_URL.",
      undefined,
      undefined,
      { config }
    ) as WMSError;
  }

  if (!config.layerName) {
    return ErrorHandler.createError(
      ErrorType.VALIDATION_ERROR,
      "Название слоя не указано.",
      undefined,
      undefined,
      { config }
    ) as WMSError;
  }

  try {
    new URL(config.baseUrl);
  } catch {
    return ErrorHandler.createError(
      ErrorType.VALIDATION_ERROR,
      "Некорректный URL для WMS сервиса.",
      undefined,
      undefined,
      { config }
    ) as WMSError;
  }

  return null;
};

export const getWMSUrl = (layerName: string): string | WMSError => {
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
): Promise<boolean> => {
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

    return response.ok;
  } catch {
    return false;
  }
};
