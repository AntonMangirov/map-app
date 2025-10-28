import { useState } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Typography,
  Button,
  Collapse,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  BugReport as BugReportIcon,
  Map as MapIcon,
  LocationOn as LocationIcon,
  Wifi as NetworkIcon,
} from "@mui/icons-material";
import {
  type ServiceError,
  type ContextualError,
  ErrorSeverity,
  isWMSError,
  isWFSError,
  isNetworkError,
  isTimeoutError,
} from "../types/errorTypes";
import { TypedErrorHandler } from "../utils/typedErrorHandler";

interface TypedErrorDisplayProps {
  error: ServiceError | ContextualError;
  showDetails?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
}

export const TypedErrorDisplay: React.FC<TypedErrorDisplayProps> = ({
  error,
  showDetails = false,
  onRetry,
  onDismiss,
  compact = false,
}) => {
  const [expanded, setExpanded] = useState(showDetails);

  const contextualError =
    "context" in error
      ? (error as ContextualError)
      : TypedErrorHandler.createContextualError(error as ServiceError);

  const summary = TypedErrorHandler.createErrorSummary(contextualError);
  const category = TypedErrorHandler.getErrorCategory(error as ServiceError);

  const getSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return <InfoIcon />;
      case ErrorSeverity.MEDIUM:
        return <WarningIcon />;
      case ErrorSeverity.HIGH:
        return <ErrorIcon />;
      case ErrorSeverity.CRITICAL:
        return <BugReportIcon />;
      default:
        return <ErrorIcon />;
    }
  };

  const getSeverityColor = (
    severity: ErrorSeverity
  ): "error" | "warning" | "info" => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return "info";
      case ErrorSeverity.MEDIUM:
        return "warning";
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return "error";
      default:
        return "error";
    }
  };

  const getServiceIcon = (error: ServiceError | ContextualError) => {
    const serviceError =
      "context" in error ? (error as ServiceError) : (error as ServiceError);

    if (isWMSError(serviceError)) {
      return <MapIcon fontSize="small" />;
    }
    if (isWFSError(serviceError)) {
      return <LocationIcon fontSize="small" />;
    }
    if (isNetworkError(serviceError) || isTimeoutError(serviceError)) {
      return <NetworkIcon fontSize="small" />;
    }
    return <WarningIcon fontSize="small" />;
  };

  if (compact) {
    return (
      <Alert
        severity={getSeverityColor(summary.severity)}
        action={
          <Box sx={{ display: "flex", gap: 1 }}>
            {contextualError.retryable && onRetry && (
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={onRetry}
                variant="outlined"
              >
                Повторить
              </Button>
            )}
            {onDismiss && (
              <Button size="small" onClick={onDismiss}>
                Закрыть
              </Button>
            )}
          </Box>
        }
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {getServiceIcon(error)}
          <Typography variant="body2">{summary.title}</Typography>
        </Box>
      </Alert>
    );
  }

  return (
    <Alert severity={getSeverityColor(summary.severity)} sx={{ mb: 2 }}>
      <AlertTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {getSeverityIcon(summary.severity)}
        {summary.title}
        <Chip
          label={category.displayName}
          size="small"
          variant="outlined"
          sx={{ ml: "auto" }}
        />
      </AlertTitle>

      <Typography variant="body2" sx={{ mb: 2 }}>
        {summary.message}
      </Typography>

      {summary.actions.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Рекомендуемые действия:
          </Typography>
          <List dense>
            {summary.actions.map((action, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon>
                  <Typography variant="body2">•</Typography>
                </ListItemIcon>
                <ListItemText
                  primary={action}
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
        {contextualError.retryable && onRetry && (
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
            variant="outlined"
          >
            Повторить
          </Button>
        )}
        {onDismiss && (
          <Button size="small" onClick={onDismiss}>
            Закрыть
          </Button>
        )}
        <Button
          size="small"
          startIcon={<ExpandMoreIcon />}
          onClick={() => setExpanded(!expanded)}
          sx={{ ml: "auto" }}
        >
          {expanded ? "Скрыть детали" : "Показать детали"}
        </Button>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Техническая информация:
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography
              variant="body2"
              component="pre"
              sx={{
                fontFamily: "monospace",
                fontSize: "0.75rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {TypedErrorHandler.formatForLogging(contextualError)}
            </Typography>
          </Box>

          {isWMSError(error as ServiceError) && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                WMS Слой:{" "}
                {(error as ServiceError & { layerName: string }).layerName}
              </Typography>
            </Box>
          )}

          {isWFSError(error as ServiceError) && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                WFS Слой:{" "}
                {(error as ServiceError & { layerName: string }).layerName} |
                Координаты: [
                {(
                  error as ServiceError & {
                    coordinates: { lat: number; lng: number };
                  }
                ).coordinates.lat.toFixed(6)}
                ,{" "}
                {(
                  error as ServiceError & {
                    coordinates: { lat: number; lng: number };
                  }
                ).coordinates.lng.toFixed(6)}
                ]
              </Typography>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary">
            Время: {contextualError.context?.timestamp || "Неизвестно"}
          </Typography>
        </Box>
      </Collapse>
    </Alert>
  );
};
