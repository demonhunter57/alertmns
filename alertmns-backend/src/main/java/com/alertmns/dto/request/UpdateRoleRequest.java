package com.alertmns.dto.request;

import com.alertmns.model.enums.UserRole;
import jakarta.validation.constraints.NotNull;

/** Payload PATCH /api/users/{id}/role — changement de rôle (admin uniquement). */
public record UpdateRoleRequest(
        @NotNull
        UserRole role
) {}
