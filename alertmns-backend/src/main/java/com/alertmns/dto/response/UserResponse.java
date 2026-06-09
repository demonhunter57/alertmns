package com.alertmns.dto.response;

import com.alertmns.model.User;
import com.alertmns.model.enums.UserRole;
import com.alertmns.model.enums.UserStatus;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO de réponse représentant un utilisateur sans données sensibles.
 *
 * Le champ passwordHash est délibérément ABSENT de ce record.
 * Toute réponse API retournant un utilisateur utilise ce DTO, jamais l'entité brute.
 *
 * La méthode statique from(User) centralise la conversion entité → DTO,
 * évitant tout mapping dispersé dans les contrôleurs.
 */
public record UserResponse(
        UUID id,
        String username,
        String email,
        String displayName,
        String initials,
        UserRole role,
        UserStatus status,
        LocalDate absentUntil,
        String absentMessage,
        String color
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.getInitials(),
                user.getRole(),
                user.getStatus(),
                user.getAbsentUntil(),
                user.getAbsentMessage(),
                user.getColor()
        );
    }
}
