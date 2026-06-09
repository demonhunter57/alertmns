package com.alertmns.service;

import com.alertmns.dto.request.UpdateRoleRequest;
import com.alertmns.dto.response.UserResponse;
import com.alertmns.model.User;
import com.alertmns.model.enums.UserRole;
import com.alertmns.model.enums.UserStatus;
import com.alertmns.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/**
 * Service gérant la gestion des utilisateurs (lecture + administration).
 *
 * setStatus   : met à jour le statut temps réel d'un utilisateur
 *               (appelé par le WebSocketController lors d'un événement status:set)
 * updateRole  : réservé aux ADMIN — change le rôle d'un utilisateur
 * deleteUser  : réservé aux ADMIN — un admin ne peut pas se supprimer lui-même
 */
@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse getUser(UUID id) {
        return UserResponse.from(findUser(id));
    }

    public UserResponse setStatus(UUID userId, UserStatus status,
                                   String absentUntil, String absentMessage) {
        User user = findUser(userId);
        user.setStatus(status);

        if (status == UserStatus.AWAY) {
            if (absentUntil != null) {
                user.setAbsentUntil(java.time.LocalDate.parse(absentUntil));
            }
            if (absentMessage != null) {
                user.setAbsentMessage(absentMessage);
            }
        } else {
            user.setAbsentUntil(null);
            user.setAbsentMessage(null);
        }

        return UserResponse.from(userRepository.save(user));
    }

    public UserResponse updateRole(UUID targetId, UUID requesterId,
                                    UpdateRoleRequest request) {
        User requester = findUser(requesterId);
        if (requester.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only admins can change roles");
        }

        User target = findUser(targetId);
        target.setRole(request.role());
        return UserResponse.from(userRepository.save(target));
    }

    public void deleteUser(UUID targetId, UUID requesterId) {
        User requester = findUser(requesterId);
        if (requester.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only admins can delete users");
        }
        if (targetId.equals(requesterId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Admin cannot delete their own account");
        }
        userRepository.deleteById(targetId);
    }

    private User findUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));
    }
}
