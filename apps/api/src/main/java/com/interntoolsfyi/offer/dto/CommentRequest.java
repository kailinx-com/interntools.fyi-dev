package com.interntoolsfyi.offer.dto;

import jakarta.validation.constraints.NotBlank;

public record CommentRequest(@NotBlank(message = "body is required") String body) {}
