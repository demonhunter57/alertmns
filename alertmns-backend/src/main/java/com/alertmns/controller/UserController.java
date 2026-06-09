package com.alertmns.controller;

import com.alertmns.dto.request.UpdateRoleRequest;
import com.alertmns.dto.response.UserResponse;
import com.alertmns.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Contrôleur REST pour la gestion des utilisateurs.
 *
 * GET    /api/users               — liste de tous les utilisateurs
 * GET    /api/users/{id}          — détails d'un utilisateur
 * PATCH  /api/users/{id}/role     — changement de rôle (ADMIN seulement)
 * DELETE /api/users/{id}          — suppression (ADMIN seulement)
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUser(id));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<UserResponse> updateRole(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateRoleRequest request) {
        return ResponseEntity.ok(
                userService.updateRole(id, extractId(userDetails), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        userService.deleteUser(id, extractId(userDetails));
        return ResponseEntity.noContent().build();
    }

    private UUID extractId(UserDetails userDetails) {
        return UUID.fromString(userDetails.getUsername());
    }
}
