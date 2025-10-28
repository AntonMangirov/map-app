# HTTP Client Architecture

## Описание

HTTP клиент с Repository паттерном, Interceptors и централизованной обработкой ошибок.

## Структура

### HTTP Client (`HttpClient.ts`)

- Основной HTTP клиент с retry логикой и timeout
- InterceptorManager для обработки запросов/ответов
- Типобезопасные интерфейсы RequestConfig/HttpResponse

### Interceptors (`interceptors.ts`)

- **AuthInterceptor**: Автоматическая авторизация
- **LoggingInterceptor**: Логирование запросов (dev режим)
- **ErrorHandlingInterceptor**: Централизованная обработка ошибок
- **PerformanceInterceptor**: Мониторинг производительности
- **ContentTypeInterceptor**: Автоматические заголовки

### Repository Pattern (`BaseRepository.ts`)

- **AbstractRepository**: Базовый класс с HTTP операциями
- **WMSRepository**: WMS операции (GetMap, GetCapabilities)
- **WFSRepository**: WFS операции (GetFeature, авторизация)
- **RepositoryFactory**: Singleton фабрика

### Services (`services/`)

- **WMSService**: Высокоуровневые WMS операции
- **WFSService**: Высокоуровневые WFS операции
- Обратная совместимость с существующим кодом

## Использование

### Базовый HTTP запрос

```typescript
import { HttpClientFactory } from "./http";

const client = HttpClientFactory.createClient({
  baseURL: "https://api.example.com",
  timeout: 10000,
  retryCount: 3,
});

const response = await client.get("/data");
```

### Repository

```typescript
import { RepositoryFactory } from "./repositories";

const wmsRepo = RepositoryFactory.getWMSRepository();
const capabilities = await wmsRepo.getCapabilities();
```

### Service (обратная совместимость)

```typescript
import { getWMSUrl, testWMSConnection } from "./services/WMSService";

const url = getWMSUrl("layer-name");
const isConnected = await testWMSConnection("layer-name");
```

## Конфигурация

### Environment Variables

- `VITE_WMS_BASE_URL`: WMS сервер
- `VITE_WFS_BASE_URL`: WFS сервер
- `VITE_WFS_USERNAME`: WFS логин
- `VITE_WFS_PASSWORD`: WFS пароль

### HTTP Client Config

```typescript
interface HttpConfig {
  baseURL?: string;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  enableLogging?: boolean;
  enablePerformanceMonitoring?: boolean;
}
```

## Особенности

- **Retry с exponential backoff**: delay \* 2^(attempt-1)
- **Централизованная обработка ошибок**: Типизированная система ошибок
- **Interceptors**: Авторизация, логирование, производительность
- **Repository Pattern**: Разделение HTTP и бизнес логики
- **Type Safety**: Полная поддержка TypeScript
- **Обратная совместимость**: Существующий код работает без изменений

## Миграция

- **Без breaking changes**: Все импорты работают как раньше
- **Постепенная миграция**: Можно мигрировать компоненты по одному
- **Улучшенные возможности**: Новая архитектура предоставляет дополнительные функции
