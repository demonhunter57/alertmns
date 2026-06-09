package com.alertmns.service;

import com.alertmns.dto.request.CreateChannelRequest;
import com.alertmns.dto.request.UpdateMembersRequest;
import com.alertmns.dto.response.ChannelResponse;
import com.alertmns.model.Channel;
import com.alertmns.model.User;
import com.alertmns.model.enums.UserRole;
import com.alertmns.repository.ChannelRepository;
import com.alertmns.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/**
 * Service gérant la logique métier des canaux de discussion.
 *
 * Règles de contrôle d'accès :
 *  - Un canal public est visible par tous.
 *  - Un canal privé n'est visible et accessible qu'aux membres listés.
 *  - La suppression d'un canal est réservée aux ADMIN.
 *  - La gestion des membres (add/remove) est réservée au créateur ou à un ADMIN.
 *
 * Lors de la création d'un canal privé, le créateur est automatiquement ajouté
 * aux membres afin de ne pas se retrouver exclu de son propre canal.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ChannelService {

    private final ChannelRepository channelRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ChannelResponse> getAccessibleChannels(UUID userId) {
        return channelRepository.findAccessibleChannels(userId)
                .stream()
                .map(ChannelResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ChannelResponse getChannel(UUID channelId, UUID requesterId) {
        Channel channel = findChannel(channelId);
        assertAccess(channel, requesterId);
        return ChannelResponse.from(channel);
    }

    public ChannelResponse createChannel(CreateChannelRequest request, UUID creatorId) {
        if (channelRepository.existsByName(request.name())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Channel name already exists");
        }

        User creator = findUser(creatorId);

        Channel channel = Channel.builder()
                .name(request.name())
                .description(request.description())
                .isPrivate(request.isPrivate())
                .createdBy(creatorId)
                .build();

        if (request.isPrivate()) {
            channel.getMembers().add(creator);
        }

        return ChannelResponse.from(channelRepository.save(channel));
    }

    public ChannelResponse updateMembers(UUID channelId, UpdateMembersRequest request,
                                          UUID requesterId) {
        Channel channel = findChannel(channelId);
        User requester = findUser(requesterId);

        if (!channel.getCreatedBy().equals(requesterId)
                && requester.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the channel creator or an admin can manage members");
        }

        for (UUID userId : request.userIds()) {
            User user = findUser(userId);
            if ("add".equalsIgnoreCase(request.action())) {
                channel.getMembers().add(user);
            } else if ("remove".equalsIgnoreCase(request.action())) {
                channel.getMembers().remove(user);
            }
        }

        return ChannelResponse.from(channelRepository.save(channel));
    }

    public void deleteChannel(UUID channelId, UUID requesterId) {
        User requester = findUser(requesterId);
        if (requester.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only admins can delete channels");
        }
        Channel channel = findChannel(channelId);
        channelRepository.delete(channel);
    }

    private void assertAccess(Channel channel, UUID userId) {
        if (!channel.isPrivate()) return;
        boolean isMember = channel.getMembers().stream()
                .anyMatch(u -> u.getId().equals(userId));
        if (!isMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Access denied to private channel");
        }
    }

    private Channel findChannel(UUID id) {
        return channelRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Channel not found"));
    }

    private User findUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));
    }
}
