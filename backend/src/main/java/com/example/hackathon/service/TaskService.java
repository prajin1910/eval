package com.example.hackathon.service;

import com.example.hackathon.dto.TaskRequest;
import com.example.hackathon.dto.TaskResponse;
import com.example.hackathon.model.Task;
import com.example.hackathon.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    public TaskResponse createTask(String studentId, TaskRequest request) {
        Task task = new Task();
        task.setStudentId(studentId);
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStartDateTime(request.getStartDateTime());
        task.setEndDateTime(request.getEndDateTime());
        task.setPriority(Task.TaskPriority.valueOf(request.getPriority()));
        
        // Auto-determine status based on dates
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(request.getStartDateTime())) {
            task.setStatus(Task.TaskStatus.PENDING);
        } else if (now.isAfter(request.getStartDateTime()) && now.isBefore(request.getEndDateTime())) {
            task.setStatus(Task.TaskStatus.ONGOING);
        }
        
        Task savedTask = taskRepository.save(task);
        return new TaskResponse(savedTask);
    }

    public List<TaskResponse> getAllTasks(String studentId) {
        List<Task> tasks = taskRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
        return tasks.stream()
                .map(TaskResponse::new)
                .collect(Collectors.toList());
    }

    public List<TaskResponse> getTasksByStatus(String studentId, Task.TaskStatus status) {
        List<Task> tasks = taskRepository.findByStudentIdAndStatus(studentId, status);
        return tasks.stream()
                .map(TaskResponse::new)
                .collect(Collectors.toList());
    }

    public TaskResponse updateTask(String taskId, String studentId, TaskRequest request) {
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        if (!taskOpt.isPresent()) {
            throw new RuntimeException("Task not found");
        }
        
        Task task = taskOpt.get();
        if (!task.getStudentId().equals(studentId)) {
            throw new RuntimeException("Unauthorized to update this task");
        }
        
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStartDateTime(request.getStartDateTime());
        task.setEndDateTime(request.getEndDateTime());
        task.setPriority(Task.TaskPriority.valueOf(request.getPriority()));
        task.setUpdatedAt(LocalDateTime.now());
        
        Task savedTask = taskRepository.save(task);
        return new TaskResponse(savedTask);
    }

    public void deleteTask(String taskId, String studentId) {
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        if (!taskOpt.isPresent()) {
            throw new RuntimeException("Task not found");
        }
        
        Task task = taskOpt.get();
        if (!task.getStudentId().equals(studentId)) {
            throw new RuntimeException("Unauthorized to delete this task");
        }
        
        taskRepository.deleteById(taskId);
    }

    public TaskResponse markTaskCompleted(String taskId, String studentId) {
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        if (!taskOpt.isPresent()) {
            throw new RuntimeException("Task not found");
        }
        
        Task task = taskOpt.get();
        if (!task.getStudentId().equals(studentId)) {
            throw new RuntimeException("Unauthorized to update this task");
        }
        
        task.setStatus(Task.TaskStatus.COMPLETED);
        task.setCompletedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());
        
        Task savedTask = taskRepository.save(task);
        return new TaskResponse(savedTask);
    }

    public TaskResponse updateTaskStatus(String taskId, String studentId, Task.TaskStatus status) {
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        if (!taskOpt.isPresent()) {
            throw new RuntimeException("Task not found");
        }
        
        Task task = taskOpt.get();
        if (!task.getStudentId().equals(studentId)) {
            throw new RuntimeException("Unauthorized to update this task");
        }
        
        task.setStatus(status);
        if (status == Task.TaskStatus.COMPLETED) {
            task.setCompletedAt(LocalDateTime.now());
        }
        task.setUpdatedAt(LocalDateTime.now());
        
        Task savedTask = taskRepository.save(task);
        return new TaskResponse(savedTask);
    }

    public TaskResponse getTaskById(String taskId, String studentId) {
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        if (!taskOpt.isPresent()) {
            throw new RuntimeException("Task not found");
        }
        
        Task task = taskOpt.get();
        if (!task.getStudentId().equals(studentId)) {
            throw new RuntimeException("Unauthorized to view this task");
        }
        
        return new TaskResponse(task);
    }

    public long getTaskCountByStatus(String studentId, Task.TaskStatus status) {
        return taskRepository.countByStudentIdAndStatus(studentId, status);
    }

    public List<TaskResponse> getOverdueTasks(String studentId) {
        List<Task> tasks = taskRepository.findByStudentIdAndEndDateTimeBeforeAndStatusNot(
            studentId, LocalDateTime.now(), Task.TaskStatus.COMPLETED);
        return tasks.stream()
                .map(TaskResponse::new)
                .collect(Collectors.toList());
    }
}