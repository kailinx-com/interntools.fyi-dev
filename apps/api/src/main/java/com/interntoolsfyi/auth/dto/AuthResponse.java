package com.interntoolsfyi.auth.dto;

import com.interntoolsfyi.user.model.Role;

public record AuthResponse(Long id, String username, String email, Role role) {}
