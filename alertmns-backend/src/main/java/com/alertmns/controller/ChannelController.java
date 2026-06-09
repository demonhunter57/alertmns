package com.alertmns.controller;

import com.alertmns.dto.request.CreateChannelRequest;
import com.alertmns.dto.request.UpdateMembersRequest;
import com.alertmns.dto.response.ChannelResponse;
import com.alertmns.service.ChannelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Contrôleur REST pour la gestion des canaux.
 *
 * GET    /api/channels            — liste des canaux accessibles
 * POST   /api/channels            — création d'un canal
 * GET    /api/channels/{id}       — détails d'un canal
 * PATCH  /api/channels/{id}/members — gestion des membres
 * DELETE /api/channels/{id}       — suppression (ADMIN uniquement)
 */
@RestController
@RequestMapping("/api/channels")
@RequiredArgsConstructor
public class ChannelController {

    private final ChannelService channelService;

    @GetMapping
    public ResponseEntity<List<ChannelResponse>> getChannels(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                channelService.getAccessibleChannels(extractId(userDetails)));
    }

    @PostMapping
    public ResponseEntity<ChannelResponse> createChannel(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateChannelRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(channelService.createChannel(request, extractId(userDetails)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChannelResponse> getChannel(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                channelService.getChannel(id, extractId(userDetails)));
    }

    @PatchMapping("/{id}/members")
    public ResponseEntity<ChannelResponse> updateMembers(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateMembersRequest request) {
        return ResponseEntity.ok(
                channelService.updateMembers(id, request, extractId(userDetails)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChannel(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        channelService.deleteChannel(id, extractId(userDetails));
        return ResponseEntity.noContent().build();
    }

    private UUID extractId(UserDetails userDetails) {
        return UUID.fromString(userDetails.getUsername());
    }
}
