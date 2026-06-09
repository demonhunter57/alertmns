package com.alertmns.repository;

import com.alertmns.model.Channel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository JPA pour l'entité Channel.
 *
 * findAccessibleChannels :
 *   Retourne les canaux accessibles à un utilisateur donné.
 *   Un canal est accessible si :
 *     - il est public (isPrivate = false), OU
 *     - l'utilisateur est membre (present dans channel_members)
 *   Cette requête JPQL utilise un LEFT JOIN pour couvrir les deux cas.
 */
@Repository
public interface ChannelRepository extends JpaRepository<Channel, UUID> {

    @Query("""
            SELECT DISTINCT c FROM Channel c
            LEFT JOIN c.members m
            WHERE c.isPrivate = false
               OR m.id = :userId
            ORDER BY c.name
            """)
    List<Channel> findAccessibleChannels(@Param("userId") UUID userId);

    boolean existsByName(String name);
}
