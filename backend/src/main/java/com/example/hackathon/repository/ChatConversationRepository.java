package com.example.hackathon.repository;

import com.example.hackathon.model.ChatConversation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatConversationRepository extends MongoRepository<ChatConversation, String> {
    
    @Query("{'$or': [{'user1Id': ?0, 'user2Id': ?1}, {'user1Id': ?1, 'user2Id': ?0}]}")
    Optional<ChatConversation> findByUsers(String userId1, String userId2);
    
    @Query("{'$or': [{'user1Id': ?0}, {'user2Id': ?0}]}")
    List<ChatConversation> findByUserId(String userId);
}