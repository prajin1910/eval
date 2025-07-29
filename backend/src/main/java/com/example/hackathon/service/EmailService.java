package com.example.hackathon.service;

import com.example.hackathon.model.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender emailSender;

    public void sendOTP(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("noreply@smarteval.com");
        message.setTo(to);
        message.setSubject("SmartEval - Email Verification");
        message.setText("Your verification code is: " + otp + "\n\nThis code will expire in 10 minutes.");
        
        emailSender.send(message);
    }

    public void sendAlumniApprovalNotification(String to, String professorName, boolean approved) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("noreply@smarteval.com");
        message.setTo(to);
        message.setSubject("SmartEval - Alumni Request Status");
        
        String status = approved ? "approved" : "rejected";
        message.setText("Your alumni registration request has been " + status + " by Professor " + professorName + ".");
        
        emailSender.send(message);
    }

    public void sendTaskReminder(String to, Task task, long hoursUntilDue) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("noreply@smarteval.com");
        message.setTo(to);
        message.setSubject("SmartEval - Task Reminder: " + task.getTitle());
        
        String timeText = hoursUntilDue <= 1 ? "less than 1 hour" : hoursUntilDue + " hours";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a");
        
        String emailBody = "Dear Student,\n\n" +
                "This is a reminder that your task is due soon:\n\n" +
                "Task: " + task.getTitle() + "\n" +
                "Description: " + (task.getDescription() != null ? task.getDescription() : "No description") + "\n" +
                "Due Date: " + task.getEndDateTime().format(formatter) + "\n" +
                "Time Remaining: " + timeText + "\n" +
                "Priority: " + task.getPriority() + "\n\n" +
                "Please complete your task on time.\n\n" +
                "Best regards,\n" +
                "SmartEval Team";
        
        message.setText(emailBody);
        emailSender.send(message);
    }
}