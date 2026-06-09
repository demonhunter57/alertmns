package com.alertmns.service;

import com.alertmns.dto.request.EditMessageRequest;
import com.alertmns.dto.response.MessageResponse;
import com.alertmns.model.Message;
import com.alertmns.model.User;
import com.alertmns.model.enums.UserRole;
import com.alertmns.repository.MessageRepository;
import com.alertmns.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;

/**
 * Service gérant les messages de canaux.
 *
 * getHistory    : retourne les 50 derniers messages d'un canal (ORDER BY createdAt ASC)
 * editMessage   : seul l'auteur peut modifier, le champ editedAt est mis à jour
 * deleteMessage : l'auteur OU un ADMIN peut supprimer
 * toggleReaction: ajoute l'emoji si absent, le retire si déjà présent (toggle)
 *
 * Les réactions sont stockées en JSON (Map<emoji, List<userId>>).
 * ObjectMapper est réutilisé (thread-safe) pour la sérialisation/désérialisation.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class MessageService {

    private static final int HISTORY_LIMIT = 50;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<MessageResponse> getHistory(UUID channelId) {
        return messageRepository.findByChannelIdOrderByCreatedAtAsc(
                        channelId, PageRequest.of(0, HISTORY_LIMIT))
                .stream()
                .map(MessageResponse::from)
                .toList();
    }

    public MessageResponse saveMessage(UUID channelId, UUID authorId, String content) {
        User author = findUser(authorId);
        Message message = Message.builder()
                .channelId(channelId)
                .author(author)
                .content(content)
                .build();
        return MessageResponse.from(messageRepository.save(message));
    }

    public MessageResponse editMessage(UUID messageId, UUID requesterId,
                                        EditMessageRequest request) {
        Message message = findMessage(messageId);

        if (!message.getAuthor().getId().equals(requesterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the author can edit this message");
        }

        message.setContent(request.content());
        message.setEditedAt(Instant.now());
        return MessageResponse.from(messageRepository.save(message));
    }

    public void deleteMessage(UUID messageId, UUID requesterId) {
        Message message = findMessage(messageId);
        User requester = findUser(requesterId);

        boolean isAuthor = message.getAuthor().getId().equals(requesterId);
        boolean isAdmin = requester.getRole() == UserRole.ADMIN;

        if (!isAuthor && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You cannot delete this message");
        }

        messageRepository.delete(message);
    }

    public MessageResponse toggleReaction(UUID messageId, UUID userId, String emoji) {
        Message message = findMessage(messageId);

        Map<String, List<String>> reactions = deserializeReactions(message.getReactionsJson());
        String userIdStr = userId.toString();

        reactions.computeIfAbsent(emoji, k -> new ArrayList<>());
        List<String> users = reactions.get(emoji);

        if (users.contains(userIdStr)) {
            users.remove(userIdStr);
            if (users.isEmpty()) reactions.remove(emoji);
        } else {
            users.add(userIdStr);
        }

        message.setReactionsJson(serializeReactions(reactions));
        return MessageResponse.from(messageRepository.save(message));
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getAllForExport(UUID channelId) {
        return messageRepository.findAllByChannelId(channelId)
                .stream()
                .map(MessageResponse::from)
                .toList();
    }

    private Map<String, List<String>> deserializeReactions(String json) {
        if (json == null || json.isBlank() || json.equals("{}")) {
            return new HashMap<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("Failed to deserialize reactions: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    private String serializeReactions(Map<String, List<String>> reactions) {
        try {
            return objectMapper.writeValueAsString(reactions);
        } catch (Exception e) {
            log.warn("Failed to serialize reactions: {}", e.getMessage());
            return "{}";
        }
    }

    private Message findMessage(UUID id) {
        return messageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Message not found"));
    }

    private User findUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));
    }
}
