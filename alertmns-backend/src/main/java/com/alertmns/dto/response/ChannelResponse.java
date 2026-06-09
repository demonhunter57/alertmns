package com.alertmns.dto.response;

import com.alertmns.model.Channel;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO de réponse représentant un canal.
 *
 * members : liste des UUIDs des membres (pour les canaux privés).
 *           Pour les canaux publics, la liste peut être vide ou contenir
 *           les membres explicitement ajoutés.
 */
public record ChannelResponse(
        UUID id,
        String name,
        String description,
        boolean isPrivate,
        List<UUID> memberIds,
        UUID createdBy,
        Instant createdAt
) {
    public static ChannelResponse from(Channel channel) {
        return new ChannelResponse(
                channel.getId(),
                channel.getName(),
                channel.getDescription(),
                channel.isPrivate(),
                channel.getMembers().stream().map(u -> u.getId()).toList(),
                channel.getCreatedBy(),
                channel.getCreatedAt()
        );
    }
}
