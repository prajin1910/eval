package com.example.hackathon.repository;

import com.example.hackathon.model.Task;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskRepository extends MongoRepository<Task, String> {
    List<Task> findByStudentIdOrderByCreatedAtDesc(String studentId);
    List<Task> findByStudentIdAndStatus(String studentId, Task.TaskStatus status);
    List<Task> findByStudentIdAndStartDateTimeBetween(String studentId, LocalDateTime start, LocalDateTime end);
    List<Task> findByStudentIdAndEndDateTimeBeforeAndStatusNot(String studentId, LocalDateTime dateTime, Task.TaskStatus status);
    long countByStudentIdAndStatus(String studentId, Task.TaskStatus status);
    
    // New methods for task reminder system
    List<Task> findByStatusNotAndEndDateTimeBetween(Task.TaskStatus status, LocalDateTime start, LocalDateTime end);
    List<Task> findByStatusNot(Task.TaskStatus status);
}