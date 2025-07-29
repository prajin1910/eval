import React, { useState, useEffect } from 'react';
import { X, Clock, AlertTriangle } from 'lucide-react';
import { webSocketService } from '../../services/websocket';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface TaskReminder {
  type: string;
  taskId: string;
  taskTitle: string;
  hoursUntilDue: number;
  minutesUntilDue: number;
  message: string;
  timestamp: number;
  priority: string;
  dueDateTime: string;
}

const TaskReminderNotification: React.FC = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<TaskReminder[]>([]);

  useEffect(() => {
    if (user) {
      // Connect to WebSocket
      webSocketService.connect(user.id);

      // Listen for task reminder notifications
      const handleNotification = (notification: TaskReminder) => {
        if (notification.type === 'TASK_REMINDER') {
          setReminders(prev => {
            // Check if reminder already exists for this task
            const exists = prev.some(r => r.taskId === notification.taskId);
            if (!exists) {
              // Show toast notification with enhanced styling
              const isUrgent = notification.minutesUntilDue <= 60;
              const icon = notification.minutesUntilDue <= 15 ? '🚨' : 
                          notification.minutesUntilDue <= 60 ? '⚠️' : '⏰';
              
              toast.custom((t) => (
                <div className={`${
                  t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 ${
                  isUrgent ? 'ring-red-500 ring-2' : ''
                }`}>
                  <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">{icon}</span>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className={`text-sm font-medium ${isUrgent ? 'text-red-900' : 'text-gray-900'}`}>
                          Task Reminder {isUrgent && '- URGENT'}
                        </p>
                        <p className={`mt-1 text-sm ${isUrgent ? 'text-red-700' : 'text-gray-500'}`}>
                          {notification.message}
                        </p>
                        <div className="mt-2 flex text-xs text-gray-400 space-x-2">
                          <span>Priority: {notification.priority}</span>
                          <span>•</span>
                          <span>Due: {new Date(notification.dueDateTime).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex border-l border-gray-200">
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ), {
                duration: isUrgent ? 15000 : 8000, // Show urgent reminders longer
                position: 'top-right',
              });
              
              return [...prev, notification];
            }
            return prev;
          });
        }
      };

      webSocketService.onNotification(handleNotification);

      return () => {
        webSocketService.removeNotificationCallback(handleNotification);
      };
    }
  }, [user]);

  const dismissReminder = (taskId: string) => {
    setReminders(prev => prev.filter(r => r.taskId !== taskId));
  };

  const formatTimeRemaining = (hoursUntilDue: number, minutesUntilDue: number) => {
    if (minutesUntilDue <= 15) {
      return `${minutesUntilDue} minutes`;
    } else if (minutesUntilDue <= 60) {
      return `${minutesUntilDue} minutes`;
    } else if (hoursUntilDue <= 1) {
      return 'less than 1 hour';
    } else {
      return `${hoursUntilDue} hours`;
    }
  };

  if (reminders.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {reminders.slice(0, 3).map((reminder) => (
        <div
          key={reminder.taskId}
          className={`bg-white rounded-lg shadow-lg border-l-4 ${
            reminder.minutesUntilDue <= 60 ? 'border-red-500' : 'border-yellow-500'
          } p-4 max-w-sm animate-slide-in-right`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {reminder.minutesUntilDue <= 60 ? (
                <AlertTriangle className="h-5 w-5 text-red-400" />
              ) : (
                <Clock className="h-5 w-5 text-yellow-400" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {reminder.taskTitle}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Due in {formatTimeRemaining(reminder.hoursUntilDue, reminder.minutesUntilDue)}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Priority: {reminder.priority}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => dismissReminder(reminder.taskId)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
      
      {reminders.length > 3 && (
        <div className="bg-blue-50 rounded-lg p-2 text-center">
          <p className="text-sm text-blue-600">
            +{reminders.length - 3} more task reminders
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskReminderNotification;
