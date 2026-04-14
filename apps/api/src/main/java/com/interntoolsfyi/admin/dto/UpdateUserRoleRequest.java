package com.interntoolsfyi.admin.dto;

import com.interntoolsfyi.user.model.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(@NotNull(message = "Role is required") Role role) {}
