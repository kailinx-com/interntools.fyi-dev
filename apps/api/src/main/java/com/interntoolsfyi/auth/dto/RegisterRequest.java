package com.interntoolsfyi.auth.dto;

import com.interntoolsfyi.user.model.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Data Transfer Object that defines the JSON shape of requests and responses, keeping the API
 * contract clear for register requests from frontend.
 *
 * @param username
 * @param email
 * @param password
 * @param role
 * @param firstName
 * @param lastName
 */
public record RegisterRequest(
    @NotBlank(message = "Username is required") @Size(min = 1, max = 255) String username,
    @NotBlank(message = "Email is required") @Size(min = 3, max = 255) String email,
    @NotBlank(message = "Password is required") @Size(min = 8, max = 255) String password,
    @NotNull(message = "Role is required") Role role,
    @NotNull(message = "First name is required") String firstName,
    @NotNull(message = "Last name is required") String lastName) {}
