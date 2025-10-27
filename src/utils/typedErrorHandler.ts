import {
  ErrorType,
  ErrorSeverity,
  type ServiceError,
  type ContextualError,
  type ErrorCategory,
  type ErrorContext,
  isWMSError,
  isWFSError,
  isNetworkError,
  isTimeoutError,
} from "../types/errorTypes";

const ERROR_CATEGORIES: Record<ErrorType, ErrorCategory> = {
  [ErrorType.VALIDATION_ERROR]: {
    category: "CONFIGURATION",
    displayName: "Ошибка конфигурации",
    description: "Проблема с настройками приложения или параметрами запроса",
    suggestedActions: [
      "Проверьте переменные окружения",
      "Убедитесь в корректности параметров",
      "Обратитесь к администратору",
    ],
  },
  [ErrorType.AUTHENTICATION_ERROR]: {
    category: "AUTHENTICATION",
    displayName: "Ошибка авторизации",
    description: "Проблема с учетными данными или правами доступа",
    suggestedActions: [
      "Проверьте логин и пароль",
      "Обратитесь к администратору для получения доступа",
      "Попробуйте позже",
    ],
  },
  [ErrorType.AUTHORIZATION_ERROR]: {
    category: "AUTHENTICATION",
    displayName: "Ошибка доступа",
    description: "Недостаточно прав для выполнения операции",
    suggestedActions: [
      "Обратитесь к администратору",
      "Проверьте права доступа",
      "Используйте другую учетную запись",
    ],
  },
  [ErrorType.NETWORK_ERROR]: {
    category: "NETWORK",
    displayName: "Ошибка сети",
    description: "Проблема с подключением к серверу",
    suggestedActions: [
      "Проверьте подключение к интернету",
      "Попробуйте позже",
      "Обратитесь к администратору",
    ],
  },
  [ErrorType.TIMEOUT_ERROR]: {
    category: "NETWORK",
    displayName: "Превышено время ожидания",
    description: "Сервер не отвечает в установленное время",
    suggestedActions: [
      "Попробуйте позже",
      "Проверьте стабильность соединения",
      "Обратитесь к администратору",
    ],
  },
  [ErrorType.SERVER_ERROR]: {
    category: "NETWORK",
    displayName: "Ошибка сервера",
    description: "Временная проблема на стороне сервера",
    suggestedActions: [
      "Попробуйте позже",
      "Обратитесь к администратору",
      "Проверьте статус сервиса",
    ],
  },
  [ErrorType.UNKNOWN_ERROR]: {
    category: "UNKNOWN",
    displayName: "Неизвестная ошибка",
    description: "Произошла непредвиденная ошибка",
    suggestedActions: [
      "Попробуйте обновить страницу",
      "Обратитесь к администратору",
      "Сохраните детали ошибки",
    ],
  },
};

export class TypedErrorHandler {
  static createContextualError(
    error: ServiceError,
    context: Partial<ErrorContext> = {}
  ): ContextualError {
    const category = ERROR_CATEGORIES[error.type];
    const severity = this.determineSeverity(error);
    const retryable = this.isRetryable(error);

    return {
      ...error,
      context: {
        timestamp: new Date().toISOString(),
        ...context,
      },
      severity,
      retryable,
      userMessage: this.getUserMessage(error),
      technicalMessage: error.message,
    };
  }

  static determineSeverity(error: ServiceError): ErrorSeverity {
    if (isWMSError(error)) {
      if (error.type === ErrorType.VALIDATION_ERROR) {
        return ErrorSeverity.MEDIUM;
      }
      if (
        error.type === ErrorType.NETWORK_ERROR ||
        error.type === ErrorType.TIMEOUT_ERROR
      ) {
        return ErrorSeverity.HIGH;
      }
    }

    if (isWFSError(error)) {
      if (error.type === ErrorType.AUTHENTICATION_ERROR) {
        return ErrorSeverity.HIGH;
      }
      if (error.type === ErrorType.VALIDATION_ERROR) {
        return ErrorSeverity.MEDIUM;
      }
    }

    if (isNetworkError(error) || isTimeoutError(error)) {
      return ErrorSeverity.HIGH;
    }

    return ErrorSeverity.MEDIUM;
  }

  static isRetryable(error: ServiceError): boolean {
    return (
      error.type === ErrorType.NETWORK_ERROR ||
      error.type === ErrorType.TIMEOUT_ERROR ||
      error.type === ErrorType.SERVER_ERROR ||
      (error.type === ErrorType.AUTHENTICATION_ERROR && isWFSError(error))
    );
  }

  static getUserMessage(error: ServiceError): string {
    const category = ERROR_CATEGORIES[error.type];

    if (isWMSError(error)) {
      switch (error.type) {
        case ErrorType.VALIDATION_ERROR:
          return `WMS сервис не настроен: ${error.message}`;
        case ErrorType.NETWORK_ERROR:
          return `Не удается подключиться к WMS сервису`;
        case ErrorType.TIMEOUT_ERROR:
          return `WMS сервис не отвечает`;
        default:
          return `Ошибка WMS сервиса: ${error.message}`;
      }
    }

    if (isWFSError(error)) {
      switch (error.type) {
        case ErrorType.VALIDATION_ERROR:
          return `WFS сервис не настроен: ${error.message}`;
        case ErrorType.AUTHENTICATION_ERROR:
          return `Ошибка авторизации в WFS сервисе`;
        case ErrorType.NETWORK_ERROR:
          return `Не удается подключиться к WFS сервису`;
        default:
          return `Ошибка WFS сервиса: ${error.message}`;
      }
    }

    return category.displayName;
  }

  static getErrorCategory(error: ServiceError): ErrorCategory {
    return ERROR_CATEGORIES[error.type];
  }

  static formatForLogging(error: ContextualError): string {
    const baseInfo = {
      type: error.type,
      service: error.service,
      severity: error.severity,
      timestamp: error.timestamp,
      message: error.technicalMessage,
    };

    let serviceInfo = {};
    if (isWMSError(error)) {
      serviceInfo = {
        layerName: error.layerName,
        config: error.config,
      };
    } else if (isWFSError(error)) {
      serviceInfo = {
        layerName: error.layerName,
        coordinates: error.coordinates,
        requestParams: error.requestParams,
      };
    }

    return JSON.stringify(
      {
        ...baseInfo,
        ...serviceInfo,
        context: error.context,
      },
      null,
      2
    );
  }

  static createErrorSummary(error: ContextualError): {
    title: string;
    message: string;
    actions: string[];
    severity: ErrorSeverity;
  } {
    const category = this.getErrorCategory(error);

    return {
      title: category.displayName,
      message: error.userMessage,
      actions: category.suggestedActions,
      severity: error.severity,
    };
  }

  static shouldShowToUser(error: ServiceError): boolean {
    if (error.type === ErrorType.VALIDATION_ERROR) {
      const isConfigError =
        (isWMSError(error) && error.message.includes("не настроен")) ||
        (isWFSError(error) && error.message.includes("не настроен"));

      if (isConfigError && import.meta.env.PROD) {
        return false;
      }
    }

    return true;
  }

  static getRetryDelay(error: ServiceError, attemptCount: number): number {
    const baseDelay = 1000;
    const maxDelay = 30000;
    const exponentialFactor = Math.pow(2, attemptCount - 1);

    const delay = baseDelay * exponentialFactor;
    return Math.min(delay, maxDelay);
  }
}
