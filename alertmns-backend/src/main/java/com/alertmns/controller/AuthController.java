package com.alertmns.controller;

import com.alertmns.dto.request.LoginRequest;
import com.alertmns.dto.request.RegisterRequest;
import com.alertmns.dto.request.UpdateProfileRequest;
import com.alertmns.dto.response.LoginResponse;
import com.alertmns.dto.response.UserResponse;
import com.alertmns.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Contrôleur REST gérant l'authentification et le profil de l'utilisateur connecté.
 *
 * POST /api/auth/login    — connexion (public)
 * POST /api/auth/register — inscription (public)
 * GET  /api/auth/me       — profil de l'utilisateur connecté (JWT requis)
 * PATCH /api/auth/me      — mise à jour du profil (JWT requis)
 *
 * @AuthenticationPrincipal UserDetails est injecté par Spring Security
 * à partir du SecurityContext peuplé par JwtAuthenticationFilter.
 * L'UUID est extrait du username (qui contient l'UUID en String).
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.register(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authService.getMe(extractId(userDetails)));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserResponse> updateMe(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(
                authService.updateProfile(extractId(userDetails), request));
    }

    private UUID extractId(UserDetails userDetails) {
        return UUID.fromString(userDetails.getUsername());
    }
}
