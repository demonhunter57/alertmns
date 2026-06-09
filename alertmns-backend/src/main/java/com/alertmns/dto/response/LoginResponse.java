package com.alertmns.dto.response;

/**
 * DTO de réponse POST /api/auth/login et /api/auth/register.
 *
 * token : JWT Bearer à inclure dans toutes les requêtes suivantes
 *         (header: "Authorization: Bearer {token}")
 * user  : profil de l'utilisateur connecté (sans mot de passe)
 */
public record LoginResponse(
        String token,
        UserResponse user
) {}
