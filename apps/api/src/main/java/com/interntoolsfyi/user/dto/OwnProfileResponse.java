package com.interntoolsfyi.user.dto;

import com.interntoolsfyi.user.model.Role;
import java.time.Instant;

public record OwnProfileResponse(
    Long id,
    String username,
    String email,
    Role role,
    String firstName,
    String lastName,
    Instant createdAt,
    long followerCount,
    long followingCount) {}
