package com.alertmns.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Entité JPA représentant une conversation directe (DM) entre deux utilisateurs.
 *
 * Une DirectConversation :
 *  - contient exactement 2 participants (contrainte applicative, non JPA)
 *  - possède un UUID virtuel utilisé comme channelId pour ses messages
 *    → les messages DM sont stockés dans la table messages avec cet UUID
 *    → cela unifie l'accès aux messages (un seul repository)
 *
 * La table dm_participants stocke la relation ManyToMany.
 */
@Entity
@Table(name = "direct_conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectConversation {

    @Id
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "dm_participants",
            joinColumns = @JoinColumn(name = "conversation_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    private Set<User> participants = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
