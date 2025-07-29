package com.example.hackathon.service;

import com.example.hackathon.model.Task;
import com.example.hackathon.model.User;
import com.example.hackathon.repository.TaskRepository;
import com.example.hackathon.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class TaskReminderService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    // Run every 30 minutes to check for tasks due within 24 hours
    @Scheduled(fixedRate = 1800000) // 30 minutes = 1800000 ms
    public void checkTaskReminders() {
        LocalDateTime now = LocalDateTime.now();

        // Find all active tasks (not completed) that are due within 24 hours
        LocalDateTime tomorrow = now.plusDays(1);
        List<Task> activeTasks = taskRepository.findByStatusNotAndEndDateTimeBetween(
            Task.TaskStatus.COMPLETED, now, tomorrow);
        
        for (Task task : activeTasks) {
            LocalDateTime taskEndTime = task.getEndDateTime();
            
            // Calculate time until due in minutes for more precision
            long minutesUntilDue = ChronoUnit.MINUTES.between(now, taskEndTime);
            long hoursUntilDue = ChronoUnit.HOURS.between(now, taskEndTime);
            
            // Send reminders at specific intervals: 24h, 12h, 6h, 3h, 1h, 30min, 15min
            if (shouldSendReminder(minutesUntilDue)) {
                userRepository.findById(task.getStudentId()).ifPresent(student -> {
                    sendTaskReminder(student, task, hoursUntilDue, minutesUntilDue);
                });
            }
        }
    }

    private boolean shouldSendReminder(long minutesUntilDue) {
        // Send reminders at these intervals (in minutes)
        return minutesUntilDue == 1440 || // 24 hours
               minutesUntilDue == 720 ||  // 12 hours
               minutesUntilDue == 360 ||  // 6 hours
               minutesUntilDue == 180 ||  // 3 hours
               minutesUntilDue == 60 ||   // 1 hour
               minutesUntilDue == 30 ||   // 30 minutes
               minutesUntilDue == 15;     // 15 minutes
    }

    private void sendTaskReminder(User student, Task task, long hoursUntilDue, long minutesUntilDue) {
        try {
            // Send email reminder
            emailService.sendTaskReminder(student.getEmail(), task, hoursUntilDue);
            
            // Send in-app notification with more detailed timing
            notificationService.sendTaskReminderNotification(student.getId(), task, hoursUntilDue, minutesUntilDue);
            
            System.out.println("Task reminder sent for task: " + task.getTitle() + " to user: " + student.getUsername());
        } catch (Exception e) {
            System.err.println("Failed to send task reminder for task: " + task.getId() + ", error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}