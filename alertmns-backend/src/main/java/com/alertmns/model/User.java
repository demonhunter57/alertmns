package com.alertmns.model;

import com.alertmns.model.enums.UserRole;
import com.alertmns.model.enums.UserStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Entité JPA représentant un utilisateur de la plateforme AlertMNS.
 *
 * Chaque utilisateur possède :
 *  - des identifiants uniques (username, email)
 *  - un mot de passe hashé (bcrypt, jamais exposé dans les réponses API)
 *  - un rôle (ADMIN / MANAGER / USER) contrôlant les permissions
 *  - un statut de présence temps réel (ONLINE / AWAY / OFFLINE)
 *  - des informations d'absence optionnelles (date de retour + message)
 *
 * La colonne passwordHash est annotée @Column(name="password_hash") pour la
 * lisibilité en base. Elle n'est JAMAIS incluse dans les DTOs de réponse.
 */
@Entity
@Table(name = "users",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "username"),
                @UniqueConstraint(columnNames = "email")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(length = 5)
    private String initials;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserRole role = UserRole.USER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserStatus status = UserStatus.OFFLINE;

    @Column(name = "absent_until")
    private LocalDate absentUntil;

    @Column(name = "absent_message", length = 500)
    private String absentMessage;

    /** Couleur d'avatar générée côté client (ex: "#e74c3c") */
    @Column(length = 20)
    private String color;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
