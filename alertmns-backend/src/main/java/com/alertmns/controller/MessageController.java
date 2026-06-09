package com.alertmns.controller;

import com.alertmns.dto.request.EditMessageRequest;
import com.alertmns.dto.request.ReactRequest;
import com.alertmns.dto.response.MessageResponse;
import com.alertmns.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Contrôleur REST pour la gestion des messages.
 *
 * GET    /api/messages/{channelId}        — historique (50 derniers)
 * PATCH  /api/messages/{id}              — modification (auteur uniquement)
 * DELETE /api/messages/{id}              — suppression (auteur ou ADMIN)
 * POST   /api/messages/{id}/react        — toggle réaction emoji
 *
 * Note : la création de messages passe par le WebSocket (/app/chat.send)
 * pour garantir la diffusion temps réel. L'API REST ne gère que
 * les opérations asynchrones (edit, delete, react) et la récupération
 * d'historique lors du chargement d'un canal.
 */
@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping("/{channelId}")
    public ResponseEntity<List<MessageResponse>> getHistory(
            @PathVariable UUID channelId) {
        return ResponseEntity.ok(messageService.getHistory(channelId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<MessageResponse> editMessage(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody EditMessageRequest request) {
        return ResponseEntity.ok(
                messageService.editMessage(id, extractId(userDetails), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        messageService.deleteMessage(id, extractId(userDetails));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/react")
    public ResponseEntity<MessageResponse> react(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ReactRequest request) {
        return ResponseEntity.ok(
                messageService.toggleReaction(id, extractId(userDetails), request.emoji()));
    }

    private UUID extractId(UserDetails userDetails) {
        return UUID.fromString(userDetails.getUsername());
    }
}
