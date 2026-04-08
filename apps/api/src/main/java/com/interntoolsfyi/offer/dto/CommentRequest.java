package com.interntoolsfyi.offer.dto;

import jakarta.annotation.Nullable;
import jakarta.validation.constraints.NotBlank;

public record CommentRequest(
    @NotBlank(message = "body is required") String body,
    @Nullable Long parentId) {}
