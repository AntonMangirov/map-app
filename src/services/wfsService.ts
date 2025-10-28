import { RepositoryFactory } from "../repositories/BaseRepository";
import { InterceptorFactory } from "../http/interceptors";
import { HttpClient } from "../http/HttpClient";
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

export interface WFSFeature {
  type: "Feature";
  id?: string;
  geometry?: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  properties: Record<string, unknown>;
}

export interface WFSResponse {
  type: "FeatureCollection";
  features: WFSFeature[];
}

export class WFSService {
  private repository = RepositoryFactory.getWFSRepository();

  async getFeatureByPoint(
    lat: number,
    lng: number,
    layerName: string
  ): Promise<
    WFSResponse | WFSValidationError | WFSAuthenticationError | WFSResponseError
  > {
    try {
      if (!layerName) {
        return createWFSError(
          ErrorType.VALIDATION_ERROR,
          "Название слоя не указано.",
          "unknown",
          { lat, lng }
        ) as WFSValidationError;
      }

      if (isNaN(lat) || isNaN(lng)) {
        return createWFSError(
          ErrorType.VALIDATION_ERROR,
          "Некорректные координаты.",
          layerName,
          { lat, lng }
        ) as WFSValidationError;
      }

      const response = await this.repository.getFeatureByPoint(
        lat,
        lng,
        layerName
      );

      if (response.data && typeof response.data === "object") {
        const data = response.data as Record<string, unknown>;

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
            {
              bbox: `${lng - 0.001},${lat - 0.001},${lng + 0.001},${
                lat + 0.001
              }`,
              outputFormat: "application/json",
              srsname: "EPSG:4326",
            },
            new Error(`WFS Error: ${errorMessage}`)
          ) as WFSResponseError;
        }
      }

      const validatedData = validateWFSResponse(response.data);
      return validatedData as WFSResponse;
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.name === "TimeoutError" ||
          error.message.includes("timeout")
        ) {
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
  }

  async getCapabilities(): Promise<unknown> {
    try {
      const response = await this.repository.getCapabilities();
      return response.data;
    } catch (error) {
      throw createWFSError(
        ErrorType.NETWORK_ERROR,
        "Не удалось получить capabilities WFS сервиса",
        "capabilities",
        undefined,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}

const wfsService = new WFSService();

export const getFeatureByPoint = wfsService.getFeatureByPoint.bind(wfsService);

export { wfsService };
