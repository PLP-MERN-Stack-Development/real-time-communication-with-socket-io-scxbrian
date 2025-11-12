import { toast } from 'react-toastify';

const notificationSound = new Audio('./notification.mp3');

// Function to request notification permission
export const requestNotificationPermission = () => {
  if ('Notification' in window) {
    Notification.requestPermission();
  }
};

// Function to show a browser notification
export const showBrowserNotification = (title, body) => {
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
    notificationSound.play();
  }
};

// Function to show a toast notification
export const notify = (message) => {
  toast(message);
};
