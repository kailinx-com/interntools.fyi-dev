package com.interntoolsfyi.offer.dto;

import java.util.List;

public record ResolvePlaceLinksRequest(List<Long> offerIds, List<Long> comparisonIds) {
  public ResolvePlaceLinksRequest {
    offerIds = offerIds == null ? List.of() : List.copyOf(offerIds);
    comparisonIds = comparisonIds == null ? List.of() : List.copyOf(comparisonIds);
  }
}
