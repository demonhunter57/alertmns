package com.alertmns.dto.request;

import jakarta.validation.constraints.NotBlank;

/** Payload POST /api/messages/{id}/react — ajout ou retrait d'une réaction emoji. */
public record ReactRequest(
        @NotBlank
        String emoji
) {}
