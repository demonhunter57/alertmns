package com.alertmns.dto.response;

import java.time.Instant;

/**
 * DTO de réponse d'erreur standard.
 * Retourné par GlobalExceptionHandler pour toutes les erreurs API.
 *
 * status  : code HTTP (400, 401, 403, 404, 409, 500)
 * message : message d'erreur lisible par un développeur
 * timestamp : heure de l'erreur (UTC)
 */
public record ErrorResponse(
        int status,
        String message,
        Instant timestamp
) {
    public static ErrorResponse of(int status, String message) {
        return new ErrorResponse(status, message, Instant.now());
    }
}
