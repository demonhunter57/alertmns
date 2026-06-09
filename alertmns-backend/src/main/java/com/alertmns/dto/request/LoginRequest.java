package com.alertmns.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Payload de la requête POST /api/auth/login.
 *
 * Les annotations @NotBlank déclenchent une validation automatique via
 * @Valid dans le contrôleur, retournant HTTP 400 si une contrainte est violée.
 */
public record LoginRequest(
        @NotBlank(message = "Username is required")
        String username,

        @NotBlank(message = "Password is required")
        String password
) {}
