package com.alertmns.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private static final String SECRET = "alertmns-test-secret-key-min32chars!!";
    private static final long EXPIRATION_MS = 3_600_000L;

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(SECRET, EXPIRATION_MS);
    }

    @Test
    void generateToken_returnsNonNullToken() {
        String token = jwtTokenProvider.generateToken(UUID.randomUUID());
        assertThat(token).isNotNull().isNotBlank();
    }

    @Test
    void generateToken_containsCorrectUserId() {
        UUID userId = UUID.randomUUID();
        String token = jwtTokenProvider.generateToken(userId);
        assertThat(jwtTokenProvider.extractUserId(token)).isEqualTo(userId);
    }

    @Test
    void validateToken_returnsTrueForValidToken() {
        String token = jwtTokenProvider.generateToken(UUID.randomUUID());
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
    }

    @Test
    void validateToken_returnsFalseForExpiredToken() {
        JwtTokenProvider expiredProvider = new JwtTokenProvider(SECRET, -1L);
        String token = expiredProvider.generateToken(UUID.randomUUID());
        assertThat(expiredProvider.validateToken(token)).isFalse();
    }

    @Test
    void validateToken_returnsFalseForTamperedToken() {
        String token = jwtTokenProvider.generateToken(UUID.randomUUID());
        String tampered = token.substring(0, token.length() - 1) + "X";
        assertThat(jwtTokenProvider.validateToken(tampered)).isFalse();
    }

    @Test
    void extractUserId_returnsCorrectId() {
        UUID userId = UUID.randomUUID();
        assertThat(jwtTokenProvider.extractUserId(jwtTokenProvider.generateToken(userId)))
                .isEqualTo(userId);
    }
}
