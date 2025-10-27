export interface WFSFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
}

export interface WFSResponse {
  type: "FeatureCollection";
  features: WFSFeature[];
}

import { ErrorHandler, ErrorType, type AppError } from "../utils/errorHandler";

export interface WFSError extends AppError {
  layerName: string;
  coordinates: { lat: number; lng: number };
}

export const getFeatureByPoint = async (
  lat: number,
  lng: number,
  layerName: string
): Promise<WFSResponse | WFSError> => {
  try {
    const baseUrl = import.meta.env.VITE_WFS_BASE_URL;
    const username = import.meta.env.VITE_WFS_USERNAME || "mo";
    const password = import.meta.env.VITE_WFS_PASSWORD || "mo";

    if (!baseUrl) {
      return ErrorHandler.createError(
        ErrorType.VALIDATION_ERROR,
        "WFS URL не настроен. Проверьте переменную окружения VITE_WFS_BASE_URL.",
        undefined,
        undefined,
        { layerName, coordinates: { lat, lng } }
      ) as WFSError;
    }

    if (!layerName) {
      return ErrorHandler.createError(
        ErrorType.VALIDATION_ERROR,
        "Название слоя не указано.",
        undefined,
        undefined,
        { layerName, coordinates: { lat, lng } }
      ) as WFSError;
    }

    const buffer = 0.001;
    const bbox = `${lng - buffer},${lat - buffer},${lng + buffer},${
      lat + buffer
    }`;

    const params = new URLSearchParams({
      service: "WFS",
      version: "1.1.0",
      request: "GetFeature",
      typeName: layerName,
      outputFormat: "application/json",
      bbox: bbox,
      srsname: "EPSG:4326",
    });

    const url = `${baseUrl}?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      const httpError = ErrorHandler.handleHttpError(
        response.status,
        response.statusText,
        { layerName, coordinates: { lat, lng }, url }
      );
      return httpError as WFSError;
    }

    const data = await response.json();

    // Basic validation of response structure
    if (!data || typeof data !== "object") {
      return ErrorHandler.createError(
        ErrorType.VALIDATION_ERROR,
        "Некорректный формат ответа от WFS сервиса.",
        undefined,
        response.status,
        { layerName, coordinates: { lat, lng }, response: data }
      ) as WFSError;
    }

    return data;
  } catch (error) {
    const appError = ErrorHandler.handleFetchError(error, {
      layerName,
      coordinates: { lat, lng },
    });
    return appError as WFSError;
  }
};
