package com.interntoolsfyi.auth.dto;

/**
 * Combines JWT and the current user
 * so the client gets both in one call.
 * @param token
 * @param user
 */
public record LoginResponse(
        String token,
        AuthResponse user
) {
}
