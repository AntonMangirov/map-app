import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import { Snackbar, Alert } from "@mui/material";
import { type ServiceError } from "../types/errorTypes";
import { TypedErrorHandler } from "../utils/typedErrorHandler";

interface Notification {
  id: string;
  message: string;
  severity: "error" | "warning" | "info" | "success";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  error?: ServiceError;
}

interface NotificationState {
  notifications: Notification[];
}

type NotificationAction =
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "REMOVE_NOTIFICATION"; payload: string }
  | { type: "CLEAR_ALL" };

const notificationReducer = (
  state: NotificationState,
  action: NotificationAction
): NotificationState => {
  switch (action.type) {
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case "REMOVE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter(
          (n) => n.id !== action.payload
        ),
      };
    case "CLEAR_ALL":
      return {
        ...state,
        notifications: [],
      };
    default:
      return state;
  }
};

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, "id">) => void;
  showError: (error: ServiceError) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: [],
  });

  const showNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = Math.random().toString(36).substr(2, 9);
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: { ...notification, id },
      });
    },
    []
  );

  const showError = useCallback(
    (error: ServiceError) => {
      const contextualError = TypedErrorHandler.createContextualError(error);
      const summary = TypedErrorHandler.createErrorSummary(contextualError);

      showNotification({
        message: summary.message,
        severity: "error",
        duration: 6000,
        error,
      });
    },
    [showNotification]
  );

  const showSuccess = useCallback(
    (message: string) => {
      showNotification({
        message,
        severity: "success",
        duration: 4000,
      });
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (message: string) => {
      showNotification({
        message,
        severity: "warning",
        duration: 5000,
      });
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (message: string) => {
      showNotification({
        message,
        severity: "info",
        duration: 4000,
      });
    },
    [showNotification]
  );

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: "CLEAR_ALL" });
  }, []);

  const contextValue: NotificationContextType = {
    showNotification,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    removeNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer
        notifications={state.notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  );
};

interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemove,
}) => {
  return (
    <>
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.duration}
          onClose={() => onRemove(notification.id)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          sx={{ mt: 8 }}
        >
          <Alert
            onClose={() => onRemove(notification.id)}
            severity={notification.severity}
            variant="filled"
            sx={{ width: "100%" }}
            action={
              notification.action ? (
                <Alert
                  severity={notification.severity}
                  onClick={notification.action.onClick}
                  sx={{ cursor: "pointer" }}
                >
                  {notification.action.label}
                </Alert>
              ) : undefined
            }
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export const useErrorNotifications = () => {
  const { showError } = useNotifications();

  const handleError = useCallback(
    (error: ServiceError) => {
      if (TypedErrorHandler.shouldShowToUser(error)) {
        showError(error);
      }
    },
    [showError]
  );

  return { handleError };
};
