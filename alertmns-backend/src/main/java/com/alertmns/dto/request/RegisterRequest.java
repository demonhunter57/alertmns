package com.alertmns.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Payload de la requête POST /api/auth/register.
 *
 * username : 3-50 caractères, unique en base
 * email    : format email valide, unique en base
 * password : minimum 6 caractères (hashé en bcrypt avant persistance)
 * displayName : nom affiché dans l'interface
 */
public record RegisterRequest(
        @NotBlank
        @Size(min = 3, max = 50)
        String username,

        @NotBlank
        @Email
        String email,

        @NotBlank
        @Size(min = 6, max = 100)
        String password,

        @NotBlank
        @Size(min = 1, max = 100)
        String displayName
) {}
