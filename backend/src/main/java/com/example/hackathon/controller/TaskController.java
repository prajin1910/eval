package com.example.hackathon.controller;

import com.example.hackathon.dto.ApiResponse;
import com.example.hackathon.dto.TaskRequest;
import com.example.hackathon.dto.TaskResponse;
import com.example.hackathon.model.Task;
import com.example.hackathon.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin
public class TaskController {

    @Autowired
    private TaskService taskService;

    @PostMapping
    public ResponseEntity<?> createTask(@Valid @RequestBody TaskRequest request, 
                                       @RequestParam String studentId) {
        try {
            TaskResponse task = taskService.createTask(studentId, request);
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to create task: " + e.getMessage()));
        }
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<TaskResponse>> getAllTasks(@PathVariable String studentId) {
        List<TaskResponse> tasks = taskService.getAllTasks(studentId);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/student/{studentId}/status/{status}")
    public ResponseEntity<List<TaskResponse>> getTasksByStatus(@PathVariable String studentId,
                                                              @PathVariable String status) {
        try {
            Task.TaskStatus taskStatus = Task.TaskStatus.valueOf(status.toUpperCase());
            List<TaskResponse> tasks = taskService.getTasksByStatus(studentId, taskStatus);
            return ResponseEntity.ok(tasks);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<?> getTask(@PathVariable String taskId, 
                                    @RequestParam String studentId) {
        try {
            TaskResponse task = taskService.getTaskById(taskId, studentId);
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<?> updateTask(@PathVariable String taskId,
                                       @Valid @RequestBody TaskRequest request,
                                       @RequestParam String studentId) {
        try {
            TaskResponse task = taskService.updateTask(taskId, studentId, request);
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to update task: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<?> deleteTask(@PathVariable String taskId,
                                       @RequestParam String studentId) {
        try {
            taskService.deleteTask(taskId, studentId);
            return ResponseEntity.ok(new ApiResponse(true, "Task deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to delete task: " + e.getMessage()));
        }
    }

    @PutMapping("/{taskId}/complete")
    public ResponseEntity<?> markTaskCompleted(@PathVariable String taskId,
                                              @RequestParam String studentId) {
        try {
            TaskResponse task = taskService.markTaskCompleted(taskId, studentId);
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to mark task as completed: " + e.getMessage()));
        }
    }

    @PutMapping("/{taskId}/status")
    public ResponseEntity<?> updateTaskStatus(@PathVariable String taskId,
                                             @RequestParam String studentId,
                                             @RequestParam String status) {
        try {
            Task.TaskStatus taskStatus = Task.TaskStatus.valueOf(status.toUpperCase());
            TaskResponse task = taskService.updateTaskStatus(taskId, studentId, taskStatus);
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to update task status: " + e.getMessage()));
        }
    }

    @GetMapping("/student/{studentId}/stats")
    public ResponseEntity<Map<String, Object>> getTaskStats(@PathVariable String studentId) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("pending", taskService.getTaskCountByStatus(studentId, Task.TaskStatus.PENDING));
        stats.put("ongoing", taskService.getTaskCountByStatus(studentId, Task.TaskStatus.ONGOING));
        stats.put("completed", taskService.getTaskCountByStatus(studentId, Task.TaskStatus.COMPLETED));
        stats.put("overdue", taskService.getOverdueTasks(studentId).size());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/student/{studentId}/overdue")
    public ResponseEntity<List<TaskResponse>> getOverdueTasks(@PathVariable String studentId) {
        List<TaskResponse> tasks = taskService.getOverdueTasks(studentId);
        return ResponseEntity.ok(tasks);
    }
}