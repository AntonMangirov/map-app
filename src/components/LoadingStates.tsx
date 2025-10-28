import { type ReactNode } from "react";
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Skeleton,
} from "@mui/material";
import { ErrorHandler, type AppError } from "../utils/errorHandler";

interface LoadingStateProps {
  loading: boolean;
  error: AppError | null;
  data: unknown;
  loadingText?: string;
  errorTitle?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  loading,
  error,
  data,
  loadingText = "Загрузка...",
  errorTitle = "Ошибка загрузки",
  children,
  fallback,
}) => {
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
          minHeight: 200,
        }}
      >
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          {loadingText}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {errorTitle}
        </Typography>
        <Typography variant="body2">
          {ErrorHandler.getErrorMessage(error)}
        </Typography>
      </Alert>
    );
  }

  if (!data && fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface SkeletonLoaderProps {
  height?: number | string;
  width?: number | string;
  variant?: "text" | "rectangular" | "circular";
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  height,
  width,
  variant,
  count,
}) => {
  return (
    <Box>
      {Array.from({ length: count || 1 }).map((_, index) => (
        <Skeleton
          key={index}
          variant={variant || "rectangular"}
          height={height || 200}
          width={width || "100%"}
          sx={{ mb: (count || 1) > 1 ? 1 : 0 }}
        />
      ))}
    </Box>
  );
};

interface MapLoadingOverlayProps {
  loading: boolean;
  message?: string;
}

export const MapLoadingOverlay: React.FC<MapLoadingOverlayProps> = ({
  loading,
  message,
}) => {
  if (!loading) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      <CircularProgress size={50} sx={{ mb: 2 }} />
      <Typography variant="body1" color="text.secondary">
        {message || "Загрузка карты..."}
      </Typography>
    </Box>
  );
};
