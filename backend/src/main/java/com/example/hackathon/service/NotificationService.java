package com.example.hackathon.service;

import com.example.hackathon.model.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class NotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void sendTaskReminderNotification(String studentId, Task task, long hoursUntilDue, long minutesUntilDue) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "TASK_REMINDER");
        notification.put("taskId", task.getId());
        notification.put("taskTitle", task.getTitle());
        notification.put("hoursUntilDue", hoursUntilDue);
        notification.put("minutesUntilDue", minutesUntilDue);
        notification.put("message", generateReminderMessage(task, hoursUntilDue, minutesUntilDue));
        notification.put("timestamp", System.currentTimeMillis());
        notification.put("priority", task.getPriority().toString());
        notification.put("dueDateTime", task.getEndDateTime().toString());

        // Send to specific user
        messagingTemplate.convertAndSendToUser(studentId, "/queue/notifications", notification);
    }

    // Keep backward compatibility
    public void sendTaskReminderNotification(String studentId, Task task, long hoursUntilDue) {
        sendTaskReminderNotification(studentId, task, hoursUntilDue, hoursUntilDue * 60);
    }

    private String generateReminderMessage(Task task, long hoursUntilDue, long minutesUntilDue) {
        if (minutesUntilDue <= 15) {
            return "🚨 URGENT: Task '" + task.getTitle() + "' is due in " + minutesUntilDue + " minutes!";
        } else if (minutesUntilDue <= 30) {
            return "⚠️ Task '" + task.getTitle() + "' is due in " + minutesUntilDue + " minutes!";
        } else if (hoursUntilDue <= 1) {
            return "⏰ Task '" + task.getTitle() + "' is due in less than 1 hour!";
        } else if (hoursUntilDue <= 6) {
            return "⏰ Task '" + task.getTitle() + "' is due in " + hoursUntilDue + " hours";
        } else {
            return "📅 Reminder: Task '" + task.getTitle() + "' is due in " + hoursUntilDue + " hours";
        }
    }
}