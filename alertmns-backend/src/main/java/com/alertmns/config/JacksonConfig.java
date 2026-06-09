package com.alertmns.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Configuration Jackson pour la sérialisation JSON.
 *
 * JavaTimeModule : sérialise les types java.time (Instant, LocalDate)
 * en format ISO-8601 lisible (ex: "2026-06-09T10:30:00Z")
 * plutôt qu'en timestamp numérique.
 *
 * Ce bean est @Primary pour être injecté dans ExportService et MessageResponse.
 */
@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        return new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }
}
