package com.interntoolsfyi.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Data Transfer Object that defines the JSON shape of requests and responses,
 * keeping the API contract clear for login requests from frontend.
 * @param identifier
 * @param password
 */
public record LoginRequest(
        @NotBlank(message = "Username or email is required")
        @Size(min = 3, max = 255, message = "Username or email must be between 3 and 255 characters")
        String identifier,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 255)
        String password
) {
}
