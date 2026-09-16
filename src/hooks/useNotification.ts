import { useState } from "react";

export interface NotificationState {
  message: string;
  type: "success" | "error";
  show: boolean;
}

export function useNotification() {
  const [notification, setNotification] = useState<NotificationState>({
    message: "",
    type: "success",
    show: false,
  });

  const showNotification = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setNotification({
      message,
      type,
      show: true,
    });
  };

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, show: false }));
  };

  const showSuccess = (message: string) => showNotification(message, "success");
  const showError = (message: string) => showNotification(message, "error");

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
  };
}
