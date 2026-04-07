package com.interntoolsfyi.offer.dto;

import java.util.Map;

public record VoteTallyResponse(
    Long postId,
    long totalVotes,
    Map<String, Long> tally) {}
