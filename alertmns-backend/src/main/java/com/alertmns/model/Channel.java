package com.alertmns.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Entité JPA représentant un canal de discussion.
 *
 * Un canal peut être :
 *  - PUBLIC  (isPrivate=false) : visible et accessible à tous les utilisateurs
 *  - PRIVÉ   (isPrivate=true)  : accessible uniquement aux membres listés dans memberIds
 *
 * La relation ManyToMany avec User est unidirectionnelle : Channel possède la
 * table de jointure channel_members pour éviter les chargements cycliques.
 *
 * createdBy stocke l'UUID du créateur (pas de FK pour simplifier les suppressions).
 */
@Entity
@Table(name = "channels",
        uniqueConstraints = @UniqueConstraint(columnNames = "name"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Channel {

    @Id
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "is_private", nullable = false)
    @Builder.Default
    private boolean isPrivate = false;

    /**
     * Membres du canal.
     * Pour un canal public, cette liste est ignorée lors des contrôles d'accès.
     * Pour un canal privé, seuls ces membres peuvent lire/écrire.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "channel_members",
            joinColumns = @JoinColumn(name = "channel_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    private Set<User> members = new HashSet<>();

    @Column(name = "created_by", nullable = false, updatable = false)
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
