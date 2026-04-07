package com.interntoolsfyi.offer.dto;

import com.interntoolsfyi.offer.model.PostStatus;
import com.interntoolsfyi.offer.model.PostType;
import com.interntoolsfyi.offer.model.PostVisibility;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record PostRequest(
    @NotNull(message = "type is required") PostType type,
    String title,
    String body,
    PostVisibility visibility,
    @NotNull(message = "status is required") PostStatus status,
    String offerSnapshots,
    List<Long> sourceOfferIds) {}
