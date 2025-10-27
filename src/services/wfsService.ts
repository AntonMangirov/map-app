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
  features: Array<{
    type: "Feature";
    id?: string;
    geometry?: {
      type: string;
      coordinates: number[] | number[][] | number[][][];
    };
    properties: Record<string, unknown>;
  }>;
}

import { ErrorType } from "../utils/errorHandler";
import {
  type WFSError,
  type WFSValidationError,
  type WFSAuthenticationError,
  type WFSResponseError,
  createWFSError,
} from "../types/errorTypes";
import {
  validateWFSResponse,
  validateWFSErrorResponse,
} from "../schemas/validationSchemas";

export type {
  WFSError,
  WFSValidationError,
  WFSAuthenticationError,
  WFSResponseError,
};

export const getFeatureByPoint = async (
  lat: number,
  lng: number,
  layerName: string
): Promise<
  WFSResponse | WFSValidationError | WFSAuthenticationError | WFSResponseError
> => {
  try {
    const baseUrl = import.meta.env.VITE_WFS_BASE_URL;
    const username = import.meta.env.VITE_WFS_USERNAME || "mo";
    const password = import.meta.env.VITE_WFS_PASSWORD || "mo";

    if (!baseUrl) {
      return createWFSError(
        ErrorType.VALIDATION_ERROR,
        "WFS URL не настроен. Проверьте переменную окружения VITE_WFS_BASE_URL.",
        layerName,
        { lat, lng }
      ) as WFSValidationError;
    }

    if (!layerName) {
      return createWFSError(
        ErrorType.VALIDATION_ERROR,
        "Название слоя не указано.",
        "unknown",
        { lat, lng }
      ) as WFSValidationError;
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
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return createWFSError(
          ErrorType.AUTHENTICATION_ERROR,
          "Ошибка авторизации. Проверьте учетные данные.",
          layerName,
          { lat, lng },
          { bbox, outputFormat: "application/json", srsname: "EPSG:4326" },
          new Error(`HTTP ${response.status}`)
        ) as WFSAuthenticationError;
      }

      return createWFSError(
        ErrorType.SERVER_ERROR,
        `WFS сервер вернул ошибку: ${response.status} ${response.statusText}`,
        layerName,
        { lat, lng },
        { bbox, outputFormat: "application/json", srsname: "EPSG:4326" },
        new Error(`HTTP ${response.status}`)
      ) as WFSResponseError;
    }

    const data = await response.json();

    if (data.ExceptionReport) {
      const errorResponse = validateWFSErrorResponse(data);
      const errorMessage =
        errorResponse.ExceptionReport?.Exception?.ExceptionText ||
        "Unknown WFS error";

      return createWFSError(
        ErrorType.SERVER_ERROR,
        `WFS сервер вернул ошибку: ${errorMessage}`,
        layerName,
        { lat, lng },
        { bbox, outputFormat: "application/json", srsname: "EPSG:4326" },
        new Error(`WFS Error: ${errorMessage}`)
      ) as WFSResponseError;
    }

    const validatedData = validateWFSResponse(data);
    return validatedData as WFSResponse;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "TimeoutError" || error.message.includes("timeout")) {
        return createWFSError(
          ErrorType.TIMEOUT_ERROR,
          "Превышено время ожидания ответа от WFS сервера",
          layerName,
          { lat, lng },
          undefined,
          error
        ) as WFSResponseError;
      }

      if (error.message.includes("fetch")) {
        return createWFSError(
          ErrorType.NETWORK_ERROR,
          "Ошибка сети при подключении к WFS серверу",
          layerName,
          { lat, lng },
          undefined,
          error
        ) as WFSResponseError;
      }
    }

    return createWFSError(
      ErrorType.UNKNOWN_ERROR,
      "Неизвестная ошибка при запросе к WFS сервису",
      layerName,
      { lat, lng },
      undefined,
      error instanceof Error ? error : new Error(String(error))
    ) as WFSResponseError;
  }
};
