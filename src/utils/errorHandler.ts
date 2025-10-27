export enum ErrorType {
  NETWORK_ERROR = "NETWORK_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  SERVER_ERROR = "SERVER_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  statusCode?: number;
  context?: Record<string, unknown>;
}

export class ErrorHandler {
  static createError(
    type: ErrorType,
    message: string,
    originalError?: Error,
    statusCode?: number,
    context?: Record<string, unknown>
  ): AppError {
    return {
      type,
      message,
      originalError,
      statusCode,
      context,
    };
  }

  static handleFetchError(
    error: unknown,
    context?: Record<string, unknown>
  ): AppError {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return this.createError(
        ErrorType.NETWORK_ERROR,
        "Ошибка сети: проверьте подключение к интернету",
        error as Error,
        undefined,
        context
      );
    }

    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        return this.createError(
          ErrorType.TIMEOUT_ERROR,
          "Превышено время ожидания запроса",
          error,
          undefined,
          context
        );
      }

      return this.createError(
        ErrorType.UNKNOWN_ERROR,
        `Неизвестная ошибка: ${error.message}`,
        error,
        undefined,
        context
      );
    }

    return this.createError(
      ErrorType.UNKNOWN_ERROR,
      "Произошла неизвестная ошибка",
      undefined,
      undefined,
      context
    );
  }

  static handleHttpError(
    status: number,
    statusText: string,
    context?: Record<string, unknown>
  ): AppError {
    switch (status) {
      case 400:
        return this.createError(
          ErrorType.VALIDATION_ERROR,
          "Некорректный запрос. Проверьте параметры.",
          undefined,
          status,
          context
        );
      case 401:
        return this.createError(
          ErrorType.AUTHENTICATION_ERROR,
          "Ошибка авторизации. Проверьте учетные данные.",
          undefined,
          status,
          context
        );
      case 403:
        return this.createError(
          ErrorType.AUTHORIZATION_ERROR,
          "Доступ запрещен. Недостаточно прав.",
          undefined,
          status,
          context
        );
      case 404:
        return this.createError(
          ErrorType.VALIDATION_ERROR,
          "Ресурс не найден. Проверьте URL.",
          undefined,
          status,
          context
        );
      case 500:
      case 502:
      case 503:
      case 504:
        return this.createError(
          ErrorType.SERVER_ERROR,
          "Ошибка сервера. Попробуйте позже.",
          undefined,
          status,
          context
        );
      default:
        return this.createError(
          ErrorType.UNKNOWN_ERROR,
          `HTTP ошибка ${status}: ${statusText}`,
          undefined,
          status,
          context
        );
    }
  }

  static getErrorMessage(error: AppError): string {
    return error.message;
  }

  static shouldRetry(error: AppError): boolean {
    return (
      error.type === ErrorType.NETWORK_ERROR ||
      error.type === ErrorType.TIMEOUT_ERROR ||
      error.type === ErrorType.SERVER_ERROR ||
      (error.statusCode && error.statusCode >= 500)
    );
  }
}
