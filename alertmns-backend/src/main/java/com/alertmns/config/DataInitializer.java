package com.alertmns.config;

import com.alertmns.model.Channel;
import com.alertmns.model.User;
import com.alertmns.model.enums.UserRole;
import com.alertmns.model.enums.UserStatus;
import com.alertmns.repository.ChannelRepository;
import com.alertmns.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Set;

/**
 * Initialisation des données de démonstration au démarrage de l'application.
 *
 * Implémente CommandLineRunner : Spring Boot exécute run() après le démarrage
 * complet du contexte applicatif et de la base de données.
 *
 * Comptes de démonstration (identiques à l'application Node.js originale) :
 *   admin / admin123  — rôle ADMIN
 *   sofia / user123   — rôle MANAGER
 *   marc  / user123   — rôle USER
 *   lea   / user123   — rôle USER (absente jusqu'au 2026-06-16)
 *
 * Canaux créés :
 *   #general       — canal public principal
 *   #annonces      — canal public d'annonces
 *   #dev-team      — canal privé (admin + sofia + marc)
 *   #direction     — canal privé (admin + sofia)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ChannelRepository channelRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) return;

        log.info("Seeding demo data...");

        User admin = createUser("admin", "admin@alertmns.fr", "admin123",
                "Admin MNS", "AM", UserRole.ADMIN, "#e74c3c");

        User sofia = createUser("sofia", "sofia@alertmns.fr", "user123",
                "Sofia Martin", "SM", UserRole.MANAGER, "#3498db");

        User marc = createUser("marc", "marc@alertmns.fr", "user123",
                "Marc Dupont", "MD", UserRole.USER, "#2ecc71");

        User lea = createUser("lea", "lea@alertmns.fr", "user123",
                "Léa Bernard", "LB", UserRole.USER, "#f39c12");
        lea.setStatus(UserStatus.AWAY);
        lea.setAbsentUntil(LocalDate.of(2026, 6, 16));
        lea.setAbsentMessage("En formation — retour le 16 juin");
        userRepository.save(lea);

        Channel general = Channel.builder()
                .name("general")
                .description("Canal général de l'équipe")
                .isPrivate(false)
                .createdBy(admin.getId())
                .build();
        channelRepository.save(general);

        Channel annonces = Channel.builder()
                .name("annonces")
                .description("Annonces officielles")
                .isPrivate(false)
                .createdBy(admin.getId())
                .build();
        channelRepository.save(annonces);

        Channel devTeam = Channel.builder()
                .name("dev-team")
                .description("Canal privé équipe développement")
                .isPrivate(true)
                .createdBy(admin.getId())
                .members(Set.of(admin, sofia, marc))
                .build();
        channelRepository.save(devTeam);

        Channel direction = Channel.builder()
                .name("direction")
                .description("Canal privé direction")
                .isPrivate(true)
                .createdBy(admin.getId())
                .members(Set.of(admin, sofia))
                .build();
        channelRepository.save(direction);

        log.info("Demo data seeded: 4 users, 4 channels.");
    }

    private User createUser(String username, String email, String password,
                             String displayName, String initials,
                             UserRole role, String color) {
        return userRepository.save(User.builder()
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .displayName(displayName)
                .initials(initials)
                .role(role)
                .status(UserStatus.OFFLINE)
                .color(color)
                .build());
    }
}
