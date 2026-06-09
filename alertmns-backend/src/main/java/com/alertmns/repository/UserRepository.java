package com.alertmns.repository;

import com.alertmns.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository JPA pour l'entité User.
 *
 * Spring Data JPA génère automatiquement l'implémentation à partir
 * des signatures de méthodes (Derived Query Methods).
 *
 * findByUsername : utilisé lors du login (lookup par identifiant)
 * existsByUsername/Email : utilisés lors de l'inscription pour détecter les doublons
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
