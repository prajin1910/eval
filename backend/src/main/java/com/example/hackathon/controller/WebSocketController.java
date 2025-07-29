package com.example.hackathon.controller;

import com.example.hackathon.dto.SendMessageRequest;
import com.example.hackathon.model.ChatMessage;
import com.example.hackathon.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
public class WebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload SendMessageRequest messageRequest) {
        // Save message to database
        ChatMessage chatMessage = new ChatMessage(
                messageRequest.getSenderId(),
                messageRequest.getReceiverId(),
                messageRequest.getMessage()
        );
        chatMessage = chatMessageRepository.save(chatMessage);

        // Send to receiver
        messagingTemplate.convertAndSendToUser(
                messageRequest.getReceiverId(),
                "/queue/messages",
                chatMessage
        );

        // Send back to sender for confirmation
        messagingTemplate.convertAndSendToUser(
                messageRequest.getSenderId(),
                "/queue/messages",
                chatMessage
        );
    }
}