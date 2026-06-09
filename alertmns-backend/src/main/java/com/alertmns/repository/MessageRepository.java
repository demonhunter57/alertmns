package com.alertmns.repository;

import com.alertmns.model.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository JPA pour l'entité Message.
 *
 * findByChannelIdOrderByCreatedAtAsc :
 *   Récupère les N derniers messages d'un canal (via Pageable).
 *   Les messages sont retournés dans l'ordre chronologique (ASC).
 *   Utilisation : MessageService.getChannelHistory(channelId, 50)
 *
 * La requête JPQL JOIN FETCH author évite le problème N+1
 * (chaque message n'exécute pas de requête SQL séparée pour l'auteur).
 */
@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    @Query("""
            SELECT m FROM Message m
            JOIN FETCH m.author
            WHERE m.channelId = :channelId
            ORDER BY m.createdAt ASC
            """)
    List<Message> findByChannelIdOrderByCreatedAtAsc(
            @Param("channelId") UUID channelId,
            Pageable pageable);

    @Query("""
            SELECT m FROM Message m
            JOIN FETCH m.author
            WHERE m.channelId = :channelId
            ORDER BY m.createdAt ASC
            """)
    List<Message> findAllByChannelId(@Param("channelId") UUID channelId);
}
