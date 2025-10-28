import { RepositoryFactory } from "../repositories/BaseRepository";
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
      console.log("WFS запрос к серверу:");
      console.log(`   - Координаты: ${lat}, ${lng}`);
      console.log(`   - Слой: ${layerName}`);

      if (!layerName) {
        console.error("WFS слой не указан:");
        console.error(
          "   - Переменная VITE_DEFAULT_LAYER_NAME не найдена в .env файле"
        );
        console.error(
          "   - Проверьте файл .env и добавьте: VITE_DEFAULT_LAYER_NAME=your-layer-name"
        );

        return createWFSError(
          ErrorType.VALIDATION_ERROR,
          "Название слоя не указано.",
          "unknown",
          { lat, lng }
        ) as WFSValidationError;
      }

      if (isNaN(lat) || isNaN(lng)) {
        console.error("WFS координаты некорректны:");
        console.error(`   - lat: ${lat}, lng: ${lng}`);
        console.error("   - Координаты должны быть числами");

        return createWFSError(
          ErrorType.VALIDATION_ERROR,
          "Некорректные координаты.",
          layerName,
          { lat, lng }
        ) as WFSValidationError;
      }

      console.log("Отправка запроса к WFS серверу...");
      const response = await this.repository.getFeatureByPoint(
        lat,
        lng,
        layerName
      );

      if (response.data && typeof response.data === "object") {
        const data = response.data as Record<string, unknown>;

        if (data.ExceptionReport) {
          console.error("WFS сервер вернул ошибку:");
          const errorResponse = validateWFSErrorResponse(data);
          const errorMessage =
            errorResponse.ExceptionReport?.Exception?.ExceptionText ||
            "Unknown WFS error";

          console.error(`   - Ошибка: ${errorMessage}`);
          console.error("   - Проверьте URL сервера в VITE_WFS_BASE_URL");
          console.error(
            "   - Проверьте логин/пароль в VITE_WFS_USERNAME/VITE_WFS_PASSWORD"
          );
          console.error(
            "   - Проверьте название слоя в VITE_DEFAULT_LAYER_NAME"
          );

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
      console.log("WFS запрос выполнен успешно");
      return validatedData as WFSResponse;
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.name === "TimeoutError" ||
          error.message.includes("timeout")
        ) {
          console.error("WFS сервер не отвечает (таймаут):");
          console.error("   - Сервер слишком медленно отвечает");
          console.error("   - Проверьте стабильность интернет соединения");

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
          console.error("Ошибка сети при подключении к WFS:");
          console.error(`   - Ошибка: ${error.message}`);
          console.error("   - Проверьте URL сервера в VITE_WFS_BASE_URL");
          console.error("   - Проверьте интернет соединение");

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

      console.error("Неизвестная ошибка WFS:");
      console.error(`   - Ошибка: ${String(error)}`);
      console.error("   - Проверьте настройки сервера и переменные окружения");

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
        { lat: 0, lng: 0 },
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}

const wfsService = new WFSService();

export const getFeatureByPoint = wfsService.getFeatureByPoint.bind(wfsService);

export { wfsService };
