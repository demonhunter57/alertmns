package com.alertmns.websocket;

import com.alertmns.dto.response.MessageResponse;
import com.alertmns.dto.response.UserResponse;
import com.alertmns.model.enums.UserStatus;
import com.alertmns.service.ChannelService;
import com.alertmns.service.MessageService;
import com.alertmns.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

/**
 * Contrôleur Spring WebSocket (STOMP) gérant tous les événements temps réel.
 *
 * Les méthodes annotées @MessageMapping traitent les messages envoyés par les
 * clients sur le préfixe /app (configuré dans WebSocketConfig).
 *
 * Architecture de diffusion :
 *  - /topic/channel.{channelId} : broadcast à tous les abonnés du canal
 *  - /topic/users               : broadcast des statuts utilisateurs
 *  - /user/{username}/queue/notifications : message personnel (SimpMessagingTemplate)
 *
 * Payload format : Map<String, Object> (JSON désérialisé automatiquement par Spring)
 * Le principal (utilisateur authentifié) est injecté via l'Authentication STOMP
 * configurée dans WebSocketConfig.configureClientInboundChannel().
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;
    private final UserService userService;
    private final ChannelService channelService;

    /** Envoi d'un message dans un canal. */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload Map<String, Object> payload, Principal principal) {
        UUID authorId = extractUserId(principal);
        UUID channelId = UUID.fromString((String) payload.get("channelId"));
        String content = (String) payload.get("content");

        try {
            channelService.assertAccess(channelId, authorId);
        } catch (ResponseStatusException e) {
            log.warn("WebSocket access denied: user {} on channel {}", authorId, channelId);
            return;
        }

        MessageResponse saved = messageService.saveMessage(channelId, authorId, content);
        messagingTemplate.convertAndSend(
                "/topic/channel." + channelId,
                Map.of("type", "message:new", "data", saved));
    }

    /** Modification d'un message existant. */
    @MessageMapping("/chat.edit")
    public void editMessage(@Payload Map<String, Object> payload, Principal principal) {
        UUID requesterId = extractUserId(principal);
        UUID messageId = UUID.fromString((String) payload.get("messageId"));
        String content = (String) payload.get("content");

        MessageResponse updated = messageService.editMessage(
                messageId, requesterId,
                new com.alertmns.dto.request.EditMessageRequest(content));

        messagingTemplate.convertAndSend(
                "/topic/channel." + updated.channelId(),
                Map.of("type", "message:edited", "data", updated));
    }

    /** Suppression d'un message. */
    @MessageMapping("/chat.delete")
    public void deleteMessage(@Payload Map<String, Object> payload, Principal principal) {
        UUID requesterId = extractUserId(principal);
        UUID messageId = UUID.fromString((String) payload.get("messageId"));
        UUID channelId = UUID.fromString((String) payload.get("channelId"));

        messageService.deleteMessage(messageId, requesterId);
        messagingTemplate.convertAndSend(
                "/topic/channel." + channelId,
                Map.of("type", "message:deleted",
                        "data", Map.of("messageId", messageId, "channelId", channelId)));
    }

    /** Toggle réaction emoji sur un message. */
    @MessageMapping("/chat.react")
    public void reactMessage(@Payload Map<String, Object> payload, Principal principal) {
        UUID userId = extractUserId(principal);
        UUID messageId = UUID.fromString((String) payload.get("messageId"));
        String emoji = (String) payload.get("emoji");

        MessageResponse updated = messageService.toggleReaction(messageId, userId, emoji);
        messagingTemplate.convertAndSend(
                "/topic/channel." + updated.channelId(),
                Map.of("type", "message:reacted", "data", updated));
    }

    /** Indicateur de frappe — début. */
    @MessageMapping("/typing.start")
    public void typingStart(@Payload Map<String, Object> payload, Principal principal) {
        UUID userId = extractUserId(principal);
        UUID channelId = UUID.fromString((String) payload.get("channelId"));
        messagingTemplate.convertAndSend(
                "/topic/channel." + channelId + ".typing",
                Map.of("type", "typing:start", "userId", userId.toString()));
    }

    /** Indicateur de frappe — fin. */
    @MessageMapping("/typing.stop")
    public void typingStop(@Payload Map<String, Object> payload, Principal principal) {
        UUID userId = extractUserId(principal);
        UUID channelId = UUID.fromString((String) payload.get("channelId"));
        messagingTemplate.convertAndSend(
                "/topic/channel." + channelId + ".typing",
                Map.of("type", "typing:stop", "userId", userId.toString()));
    }

    /** Envoi d'un message direct. */
    @MessageMapping("/dm.send")
    public void sendDm(@Payload Map<String, Object> payload, Principal principal) {
        UUID senderId = extractUserId(principal);
        UUID recipientId = UUID.fromString((String) payload.get("recipientId"));
        String content = (String) payload.get("content");

        UserResponse sender = userService.getUser(senderId);

        Map<String, Object> notification = Map.of(
                "type", "notification",
                "from", sender,
                "content", content,
                "senderId", senderId.toString()
        );

        messagingTemplate.convertAndSendToUser(
                recipientId.toString(),
                "/queue/notifications",
                notification);
    }

    /** Mise à jour du statut de présence. */
    @MessageMapping("/status.set")
    public void setStatus(@Payload Map<String, Object> payload, Principal principal) {
        UUID userId = extractUserId(principal);
        String statusStr = (String) payload.get("status");
        String absentUntil = (String) payload.get("absentUntil");
        String absentMessage = (String) payload.get("absentMessage");

        UserStatus status = UserStatus.valueOf(statusStr.toUpperCase());
        UserResponse updated = userService.setStatus(userId, status, absentUntil, absentMessage);

        messagingTemplate.convertAndSend(
                "/topic/users",
                Map.of("type", "user:status", "data", updated));
    }

    private UUID extractUserId(Principal principal) {
        return UUID.fromString(principal.getName());
    }
}
