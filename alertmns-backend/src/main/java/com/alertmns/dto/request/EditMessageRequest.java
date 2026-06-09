package com.alertmns.dto.request;

import jakarta.validation.constraints.NotBlank;

/** Payload PATCH /api/messages/{id} — modification du contenu d'un message. */
public record EditMessageRequest(
        @NotBlank(message = "Content cannot be empty")
        String content
) {}
