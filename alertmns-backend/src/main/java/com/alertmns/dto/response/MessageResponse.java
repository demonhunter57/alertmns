package com.alertmns.dto.response;

import com.alertmns.model.Message;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * DTO de réponse représentant un message avec toutes ses métadonnées.
 *
 * reactions : désérialisé depuis le JSON stocké en base
 *             Format : Map<emoji, List<userId>>
 *             Exemple : {"👍": ["uuid1", "uuid2"], "❤️": ["uuid3"]}
 *
 * author    : DTO utilisateur (sans mot de passe)
 * editedAt  : null si le message n'a jamais été modifié
 */
@Slf4j
public record MessageResponse(
        UUID id,
        UUID channelId,
        UserResponse author,
        String content,
        Map<String, List<String>> reactions,
        Instant createdAt,
        Instant editedAt
) {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static MessageResponse from(Message message) {
        Map<String, List<String>> reactions = new HashMap<>();
        try {
            if (message.getReactionsJson() != null && !message.getReactionsJson().isBlank()) {
                reactions = MAPPER.readValue(
                        message.getReactionsJson(),
                        new TypeReference<>() {});
            }
        } catch (Exception e) {
            log.warn("Failed to parse reactions JSON for message {}: {}",
                    message.getId(), e.getMessage());
        }

        return new MessageResponse(
                message.getId(),
                message.getChannelId(),
                UserResponse.from(message.getAuthor()),
                message.getContent(),
                reactions,
                message.getCreatedAt(),
                message.getEditedAt()
        );
    }
}
