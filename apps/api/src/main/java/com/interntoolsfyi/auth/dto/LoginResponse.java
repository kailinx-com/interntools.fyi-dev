package com.interntoolsfyi.auth.dto;

public record LoginResponse(
        String token,
        AuthResponse user
) {
}
