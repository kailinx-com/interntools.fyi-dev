package com.interntoolsfyi.admin.dto;

import com.interntoolsfyi.user.model.Role;

public record AdminUserResponse(
    Long id,
    String username,
    String email,
    String firstName,
    String lastName,
    Role role) {}
