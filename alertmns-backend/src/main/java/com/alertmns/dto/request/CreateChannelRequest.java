package com.alertmns.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Payload POST /api/channels — création d'un nouveau canal.
 *
 * isPrivate : si true, seuls les membres listés peuvent accéder au canal.
 * description : optionnelle.
 */
public record CreateChannelRequest(
        @NotBlank
        @Size(min = 2, max = 100)
        String name,

        @Size(max = 500)
        String description,

        boolean isPrivate
) {}
