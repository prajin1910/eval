package com.example.hackathon.controller;

import com.example.hackathon.dto.ApiResponse;
import com.example.hackathon.dto.SendMessageRequest;
import com.example.hackathon.model.ChatMessage;
import com.example.hackathon.model.ChatConversation;
import com.example.hackathon.model.User;
import com.example.hackathon.repository.ChatMessageRepository;
import com.example.hackathon.repository.ChatConversationRepository;
import com.example.hackathon.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin
public class ChatController {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private ChatConversationRepository chatConversationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody SendMessageRequest request) {
        try {
            // Save the message
            ChatMessage message = new ChatMessage(
                request.getSenderId(),
                request.getReceiverId(),
                request.getMessage()
            );
            message = chatMessageRepository.save(message);
            
            // Update or create conversation
            updateConversation(request.getSenderId(), request.getReceiverId(), request.getMessage());
            
            // Send real-time message via WebSocket
            messagingTemplate.convertAndSendToUser(
                request.getReceiverId(),
                "/queue/messages",
                message
            );
            
            // Send back to sender for confirmation
            messagingTemplate.convertAndSendToUser(
                request.getSenderId(),
                "/queue/messages",
                message
            );
            
            return ResponseEntity.ok(new ApiResponse(true, "Message sent successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, "Failed to send message: " + e.getMessage()));
        }
    }

    private void updateConversation(String senderId, String receiverId, String message) {
        Optional<ChatConversation> existingConversation = 
            chatConversationRepository.findByUsers(senderId, receiverId);
        
        ChatConversation conversation;
        if (existingConversation.isPresent()) {
            conversation = existingConversation.get();
        } else {
            conversation = new ChatConversation(senderId, receiverId);
        }
        
        conversation.setLastMessage(message);
        conversation.setLastMessageSenderId(senderId);
        conversation.setLastMessageTime(LocalDateTime.now());
        conversation.setUpdatedAt(LocalDateTime.now());
        
        // Update unread count for receiver
        if (conversation.getUser1Id().equals(receiverId)) {
            conversation.setUnreadCountUser1(conversation.getUnreadCountUser1() + 1);
        } else {
            conversation.setUnreadCountUser2(conversation.getUnreadCountUser2() + 1);
        }
        
        chatConversationRepository.save(conversation);
    }
    @GetMapping("/messages/{userId1}/{userId2}")
    public ResponseEntity<List<ChatMessage>> getMessages(
            @PathVariable String userId1,
            @PathVariable String userId2) {
        List<ChatMessage> messages = chatMessageRepository.findMessagesBetweenUsers(userId1, userId2);
        
        // Mark messages as read
        markMessagesAsRead(userId1, userId2);
        
        return ResponseEntity.ok(messages);
    }
    
    private void markMessagesAsRead(String currentUserId, String otherUserId) {
        Optional<ChatConversation> conversation = 
            chatConversationRepository.findByUsers(currentUserId, otherUserId);
        
        if (conversation.isPresent()) {
            ChatConversation conv = conversation.get();
            if (conv.getUser1Id().equals(currentUserId)) {
                conv.setUnreadCountUser1(0);
            } else {
                conv.setUnreadCountUser2(0);
            }
            chatConversationRepository.save(conv);
        }
    }
    
    @GetMapping("/conversations/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getConversations(@PathVariable String userId) {
        List<ChatConversation> conversations = chatConversationRepository.findByUserId(userId);
        
        List<Map<String, Object>> result = conversations.stream()
            .sorted((a, b) -> b.getLastMessageTime().compareTo(a.getLastMessageTime()))
            .map(conv -> {
                Map<String, Object> convMap = new HashMap<>();
                
                // Get the other user's details
                String otherUserId = conv.getUser1Id().equals(userId) ? conv.getUser2Id() : conv.getUser1Id();
                Optional<User> otherUser = userRepository.findById(otherUserId);
                
                if (otherUser.isPresent()) {
                    User user = otherUser.get();
                    convMap.put("userId", user.getId());
                    convMap.put("username", user.getUsername());
                    convMap.put("email", user.getEmail());
                    convMap.put("role", user.getRole().toString());
                    convMap.put("lastMessage", conv.getLastMessage());
                    convMap.put("lastMessageTime", conv.getLastMessageTime());
                    convMap.put("lastMessageSenderId", conv.getLastMessageSenderId());
                    
                    // Get unread count for current user
                    int unreadCount = conv.getUser1Id().equals(userId) ? 
                        conv.getUnreadCountUser1() : conv.getUnreadCountUser2();
                    convMap.put("unreadCount", unreadCount);
                }
                
                return convMap;
            })
            .filter(map -> !map.isEmpty())
            .collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(result);
    }
}