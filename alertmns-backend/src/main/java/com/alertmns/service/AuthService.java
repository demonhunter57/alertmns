package com.alertmns.service;

import com.alertmns.dto.request.LoginRequest;
import com.alertmns.dto.request.RegisterRequest;
import com.alertmns.dto.request.UpdateProfileRequest;
import com.alertmns.dto.response.LoginResponse;
import com.alertmns.dto.response.UserResponse;
import com.alertmns.model.User;
import com.alertmns.model.enums.UserRole;
import com.alertmns.model.enums.UserStatus;
import com.alertmns.repository.UserRepository;
import com.alertmns.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * Service gérant l'authentification et la gestion du profil utilisateur.
 *
 * login :
 *   - Vérifie username + password (bcrypt)
 *   - Retourne un JWT + le profil utilisateur
 *
 * register :
 *   - Vérifie l'unicité du username et de l'email
 *   - Hash le mot de passe (BCrypt cost=10)
 *   - Génère les initiales et une couleur d'avatar aléatoire
 *   - Assigne le rôle USER par défaut
 *   - Retourne un JWT + le profil créé
 *
 * updateProfile :
 *   - Met à jour les champs non-null du request
 *   - Transactionnel : rollback automatique en cas d'erreur
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private static final String[] AVATAR_COLORS = {
            "#e74c3c", "#3498db", "#2ecc71", "#f39c12",
            "#9b59b6", "#1abc9c", "#e67e22", "#e91e63"
    };

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String token = jwtTokenProvider.generateToken(user.getId());
        return new LoginResponse(token, UserResponse.from(user));
    }

    public LoginResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        String initials = buildInitials(request.displayName());
        String color = AVATAR_COLORS[(int) (Math.random() * AVATAR_COLORS.length)];

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .displayName(request.displayName())
                .initials(initials)
                .role(UserRole.USER)
                .status(UserStatus.OFFLINE)
                .color(color)
                .build();

        userRepository.save(user);
        String token = jwtTokenProvider.generateToken(user.getId());
        return new LoginResponse(token, UserResponse.from(user));
    }

    @Transactional(readOnly = true)
    public UserResponse getMe(UUID userId) {
        return UserResponse.from(findUser(userId));
    }

    public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = findUser(userId);

        if (request.displayName() != null) {
            user.setDisplayName(request.displayName());
            user.setInitials(buildInitials(request.displayName()));
        }
        if (request.status() != null) {
            user.setStatus(request.status());
        }
        if (request.absentUntil() != null) {
            user.setAbsentUntil(request.absentUntil());
        }
        if (request.absentMessage() != null) {
            user.setAbsentMessage(request.absentMessage());
        }

        return UserResponse.from(userRepository.save(user));
    }

    private User findUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private String buildInitials(String displayName) {
        if (displayName == null || displayName.isBlank()) return "?";
        String[] parts = displayName.trim().split("\\s+");
        if (parts.length >= 2) {
            return (parts[0].charAt(0) + "" + parts[1].charAt(0)).toUpperCase();
        }
        return displayName.substring(0, Math.min(2, displayName.length())).toUpperCase();
    }
}
