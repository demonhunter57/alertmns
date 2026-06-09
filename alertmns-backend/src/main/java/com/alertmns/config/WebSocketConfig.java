package com.alertmns.config;

import com.alertmns.security.JwtTokenProvider;
import com.alertmns.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configuration Spring WebSocket avec broker STOMP.
 *
 * Protocole : STOMP (Simple Text Oriented Messaging Protocol) over WebSocket.
 * STOMP est préféré aux WebSockets bruts car il apporte :
 *  - un système de topics/subscriptions structuré
 *  - l'intégration native avec Spring Security
 *  - la compatibilité avec le client @stomp/rx-stomp Angular
 *
 * Topics disponibles :
 *   /topic/channel.{channelId}           — messages d'un canal (broadcast)
 *   /topic/channel.{channelId}.typing    — indicateurs de frappe (broadcast)
 *   /topic/users                         — mises à jour de statut (broadcast)
 *   /user/queue/notifications            — notifications DM personnelles
 *
 * Destinations d'envoi client→serveur :
 *   /app/chat.send
 *   /app/chat.edit
 *   /app/chat.delete
 *   /app/chat.react
 *   /app/typing.start
 *   /app/typing.stop
 *   /app/dm.send
 *   /app/status.set
 *
 * Authentification WebSocket :
 *  Le JWT est extrait du header STOMP "Authorization" lors du CONNECT.
 *  Un ChannelInterceptor injecte l'Authentication dans le MessageChannel.
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsServiceImpl userDetailsService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        if (jwtTokenProvider.validateToken(token)) {
                            var userId = jwtTokenProvider.extractUserId(token);
                            var userDetails = userDetailsService.loadUserByUsername(userId.toString());
                            var auth = new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                            accessor.setUser(auth);
                        }
                    }
                }
                return message;
            }
        });
    }
}
