package com.alertmns.service;

import com.alertmns.dto.request.CreateChannelRequest;
import com.alertmns.dto.response.ChannelResponse;
import com.alertmns.model.Channel;
import com.alertmns.model.User;
import com.alertmns.model.enums.UserRole;
import com.alertmns.model.enums.UserStatus;
import com.alertmns.repository.ChannelRepository;
import com.alertmns.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.http.HttpStatus.FORBIDDEN;

@ExtendWith(MockitoExtension.class)
class ChannelServiceTest {

    @Mock private ChannelRepository channelRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private ChannelService channelService;

    private User buildUser(UUID id, UserRole role) {
        return User.builder()
                .id(id)
                .username("user-" + id.toString().substring(0, 8))
                .email(id + "@alertmns.com")
                .passwordHash("hash")
                .displayName("User")
                .initials("US")
                .role(role)
                .status(UserStatus.ONLINE)
                .color("#3498db")
                .build();
    }

    @Test
    void getAccessibleChannels_delegatesToRepository() {
        UUID userId = UUID.randomUUID();
        Channel pub = Channel.builder()
                .id(UUID.randomUUID()).name("general").isPrivate(false).createdBy(userId).build();
        when(channelRepository.findAccessibleChannels(userId)).thenReturn(List.of(pub));

        List<ChannelResponse> result = channelService.getAccessibleChannels(userId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("general");
        verify(channelRepository).findAccessibleChannels(userId);
    }

    @Test
    void createChannel_savesAndReturnsChannel() {
        UUID creatorId = UUID.randomUUID();
        User creator = buildUser(creatorId, UserRole.USER);
        CreateChannelRequest request = new CreateChannelRequest("alpha", "Alpha channel", false);

        when(channelRepository.existsByName("alpha")).thenReturn(false);
        when(userRepository.findById(creatorId)).thenReturn(Optional.of(creator));
        when(channelRepository.save(any(Channel.class))).thenAnswer(inv -> inv.getArgument(0));

        ChannelResponse response = channelService.createChannel(request, creatorId);

        verify(channelRepository).save(any(Channel.class));
        assertThat(response.name()).isEqualTo("alpha");
    }

    @Test
    void deleteChannel_byNonAdmin_throwsForbidden() {
        UUID requesterId = UUID.randomUUID();
        User nonAdmin = buildUser(requesterId, UserRole.USER);
        when(userRepository.findById(requesterId)).thenReturn(Optional.of(nonAdmin));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> channelService.deleteChannel(UUID.randomUUID(), requesterId));

        assertThat(ex.getStatusCode()).isEqualTo(FORBIDDEN);
        verify(channelRepository, never()).delete(any());
    }

    @Test
    void assertAccess_toPublicChannel_doesNotThrow() {
        UUID channelId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Channel pub = Channel.builder()
                .id(channelId).name("general").isPrivate(false).createdBy(userId).build();
        when(channelRepository.findById(channelId)).thenReturn(Optional.of(pub));

        // should not throw
        channelService.assertAccess(channelId, userId);
    }

    @Test
    void assertAccess_toPrivateChannelWithoutMembership_throwsForbidden() {
        UUID channelId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Channel priv = Channel.builder()
                .id(channelId).name("secret").isPrivate(true).createdBy(UUID.randomUUID()).build();
        when(channelRepository.findById(channelId)).thenReturn(Optional.of(priv));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> channelService.assertAccess(channelId, userId));

        assertThat(ex.getStatusCode()).isEqualTo(FORBIDDEN);
    }
}
