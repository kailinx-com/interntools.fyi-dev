package com.interntoolsfyi.auth.dto;

public record UpdateProfileRequest(
    String username,
    String email,
    String currentPassword,
    String newPassword) {}
