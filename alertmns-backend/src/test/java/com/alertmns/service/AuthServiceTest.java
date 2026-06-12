package com.alertmns.service;

import com.alertmns.dto.request.LoginRequest;
import com.alertmns.dto.request.RegisterRequest;
import com.alertmns.dto.response.LoginResponse;
import com.alertmns.model.User;
import com.alertmns.model.enums.UserRole;
import com.alertmns.model.enums.UserStatus;
import com.alertmns.repository.UserRepository;
import com.alertmns.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private PasswordEncoder passwordEncoder;
    @InjectMocks private AuthService authService;

    private User buildTestUser() {
        return User.builder()
                .id(UUID.randomUUID())
                .username("testuser")
                .email("test@alertmns.com")
                .passwordHash("$2a$10$hashedpassword")
                .displayName("Test User")
                .initials("TU")
                .role(UserRole.USER)
                .status(UserStatus.OFFLINE)
                .color("#3498db")
                .build();
    }

    @Test
    void login_withValidCredentials_returnsToken() {
        User user = buildTestUser();
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", user.getPasswordHash())).thenReturn(true);
        when(jwtTokenProvider.generateToken(user.getId())).thenReturn("jwt-token");

        LoginResponse response = authService.login(new LoginRequest("testuser", "password123"));

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.user().username()).isEqualTo("testuser");
    }

    @Test
    void login_withWrongPassword_throwsUnauthorized() {
        User user = buildTestUser();
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authService.login(new LoginRequest("testuser", "wrongpass")));

        assertThat(ex.getStatusCode()).isEqualTo(UNAUTHORIZED);
    }

    @Test
    void login_withUnknownUsername_throwsUnauthorized() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authService.login(new LoginRequest("unknown", "anypass")));

        assertThat(ex.getStatusCode()).isEqualTo(UNAUTHORIZED);
    }

    @Test
    void register_withExistingUsername_throwsConflict() {
        when(userRepository.existsByUsername("testuser")).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authService.register(new RegisterRequest(
                        "testuser", "new@alertmns.com", "password123", "New User")));

        assertThat(ex.getStatusCode()).isEqualTo(CONFLICT);
    }

    @Test
    void register_withExistingEmail_throwsConflict() {
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("existing@alertmns.com")).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authService.register(new RegisterRequest(
                        "newuser", "existing@alertmns.com", "password123", "New User")));

        assertThat(ex.getStatusCode()).isEqualTo(CONFLICT);
    }

    @Test
    void register_withValidData_returnsToken() {
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("new@alertmns.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("$2a$10$encoded");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtTokenProvider.generateToken(any(UUID.class))).thenReturn("new-jwt-token");

        LoginResponse response = authService.register(new RegisterRequest(
                "newuser", "new@alertmns.com", "password123", "New User"));

        verify(userRepository).save(any(User.class));
        assertThat(response.token()).isEqualTo("new-jwt-token");
        assertThat(response.user().username()).isEqualTo("newuser");
    }
}
