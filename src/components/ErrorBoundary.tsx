import { Component, type ErrorInfo, type ReactNode } from "react";
import { Box, Typography, Button, Paper, Alert } from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
            p: 3,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: "center",
            }}
          >
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Произошла ошибка в приложении
              </Typography>
            </Alert>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              К сожалению, произошла непредвиденная ошибка. Попробуйте обновить
              страницу или обратитесь к администратору, если проблема
              повторяется.
            </Typography>

            {import.meta.env.DEV && this.state.error && (
              <Box sx={{ mb: 3, textAlign: "left" }}>
                <Typography variant="subtitle2" gutterBottom>
                  Детали ошибки (только в режиме разработки):
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    backgroundColor: "grey.50",
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                    overflow: "auto",
                    maxHeight: 200,
                  }}
                >
                  <Typography variant="body2" component="pre">
                    {this.state.error.toString()}
                  </Typography>
                  {this.state.errorInfo && (
                    <Typography variant="body2" component="pre" sx={{ mt: 1 }}>
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  )}
                </Paper>
              </Box>
            )}

            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleReset}
              sx={{ mr: 2 }}
            >
              Попробовать снова
            </Button>
            <Button variant="outlined" onClick={() => window.location.reload()}>
              Обновить страницу
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
