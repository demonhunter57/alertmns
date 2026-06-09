package com.alertmns.dto.request;

import com.alertmns.model.enums.UserStatus;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Payload PATCH /api/auth/me — mise à jour du profil utilisateur connecté.
 *
 * Tous les champs sont optionnels (null = non modifié).
 * status peut être ONLINE, AWAY ou OFFLINE.
 * absentUntil + absentMessage sont utilisés lorsque status = AWAY.
 */
public record UpdateProfileRequest(
        @Size(max = 100)
        String displayName,

        UserStatus status,

        LocalDate absentUntil,

        @Size(max = 500)
        String absentMessage
) {}
