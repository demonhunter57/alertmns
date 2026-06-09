package com.alertmns;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Point d'entrée de l'application AlertMNS.
 *
 * @SpringBootApplication active :
 *   - @Configuration      : classe de configuration Spring
 *   - @EnableAutoConfiguration : auto-configuration Spring Boot
 *   - @ComponentScan      : scan des composants dans le package com.alertmns
 */
@SpringBootApplication
public class AlertMnsApplication {

    public static void main(String[] args) {
        SpringApplication.run(AlertMnsApplication.class, args);
    }
}
