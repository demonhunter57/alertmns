package com.alertmns.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.Set;
import java.util.UUID;

/**
 * Payload PATCH /api/channels/{id}/members — gestion des membres d'un canal privé.
 *
 * action : "add" ou "remove"
 * userIds : ensemble des UUIDs à ajouter ou retirer
 */
public record UpdateMembersRequest(
        @NotNull
        String action,

        @NotNull
        Set<UUID> userIds
) {}
