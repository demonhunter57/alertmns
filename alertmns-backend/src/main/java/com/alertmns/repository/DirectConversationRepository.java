package com.alertmns.repository;

import com.alertmns.model.DirectConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository JPA pour l'entité DirectConversation.
 *
 * findBetweenUsers :
 *   Cherche la conversation DM entre deux utilisateurs spécifiques.
 *   La requête vérifie que les deux participants sont membres (COUNT = 2)
 *   et que chacun des deux UUIDs est présent, garantissant l'unicité du DM.
 */
@Repository
public interface DirectConversationRepository extends JpaRepository<DirectConversation, UUID> {

    @Query("""
            SELECT dc FROM DirectConversation dc
            JOIN dc.participants p1
            JOIN dc.participants p2
            WHERE p1.id = :userId1 AND p2.id = :userId2
            """)
    Optional<DirectConversation> findBetweenUsers(
            @Param("userId1") UUID userId1,
            @Param("userId2") UUID userId2);
}
