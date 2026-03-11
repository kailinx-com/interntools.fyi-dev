package com.interntoolsfyi.auth.dto;

import com.interntoolsfyi.user.model.Role;

/**
 * For current users after registered.
 *
 * @param id
 * @param username
 * @param email
 * @param role
 */
public record AuthResponse(Long id, String username, String email, Role role) {}
