package com.alertmns.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

/**
 * Entité JPA représentant un message dans un canal.
 *
 * Les réactions (emoji → liste d'userIds) sont sérialisées en JSON dans
 * la colonne reactions_json grâce à ReactionsConverter.
 * Ce choix évite une table de jointure complexe pour un Map<String,List<UUID>>.
 *
 * channelId est un UUID non-FK afin de permettre l'utilisation de cette même
 * entité pour les messages de canaux ET les messages directs virtuels.
 *
 * editedAt est null tant que le message n'a pas été modifié.
 */
@Entity
@Table(name = "messages",
        indexes = @Index(columnList = "channel_id, created_at"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "channel_id", nullable = false)
    private UUID channelId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * Réactions stockées en JSON : {"👍": ["uuid1","uuid2"], "❤️": ["uuid3"]}
     * Voir ReactionsConverter pour la sérialisation/désérialisation.
     */
    @Column(name = "reactions_json", columnDefinition = "TEXT")
    @Builder.Default
    private String reactionsJson = "{}";

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "edited_at")
    private Instant editedAt;
}
