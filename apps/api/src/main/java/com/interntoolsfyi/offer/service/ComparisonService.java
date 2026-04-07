package com.interntoolsfyi.offer.service;

import com.interntoolsfyi.offer.dto.ComparisonRequest;
import com.interntoolsfyi.offer.dto.ComparisonResponse;
import com.interntoolsfyi.offer.model.Comparison;
import com.interntoolsfyi.offer.repository.ComparisonRepository;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ComparisonService {

  private final ComparisonRepository comparisonRepository;
  private final UserRepository userRepository;

  public ComparisonService(
      ComparisonRepository comparisonRepository, UserRepository userRepository) {
    this.comparisonRepository = comparisonRepository;
    this.userRepository = userRepository;
  }

  @Transactional(readOnly = true)
  public List<ComparisonResponse> listComparisons(Authentication auth) {
    User user = requireUser(auth);
    return comparisonRepository.findByUserOrderByCreatedAtDesc(user).stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional
  public ComparisonResponse createComparison(Authentication auth, ComparisonRequest request) {
    User user = requireUser(auth);
    Comparison comparison = new Comparison();
    comparison.setUser(user);
    applyRequest(comparison, request);
    comparison.setUpdatedAt(Instant.now());
    return toResponse(comparisonRepository.save(comparison));
  }

  @Transactional(readOnly = true)
  public ComparisonResponse getComparison(Authentication auth, Long id) {
    User user = requireUser(auth);
    return toResponse(requireOwned(id, user));
  }

  @Transactional
  public ComparisonResponse updateComparison(
      Authentication auth, Long id, ComparisonRequest request) {
    User user = requireUser(auth);
    Comparison comparison = requireOwned(id, user);
    applyRequest(comparison, request);
    comparison.setUpdatedAt(Instant.now());
    return toResponse(comparisonRepository.save(comparison));
  }

  @Transactional
  public void deleteComparison(Authentication auth, Long id) {
    User user = requireUser(auth);
    Comparison comparison = requireOwned(id, user);
    comparisonRepository.delete(comparison);
  }

  private void applyRequest(Comparison comparison, ComparisonRequest req) {
    comparison.setName(req.name());
    comparison.setIncludedOfferIds(req.includedOfferIds());
    comparison.setDescription(req.description());
    comparison.setComputedMetrics(req.computedMetrics());
  }

  private Comparison requireOwned(Long id, User user) {
    return comparisonRepository
        .findByIdAndUser(id, user)
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comparison not found"));
  }

  private User requireUser(Authentication auth) {
    if (auth == null || !auth.isAuthenticated()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }
    return userRepository
        .findByUsername(auth.getName())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
  }

  private ComparisonResponse toResponse(Comparison c) {
    return new ComparisonResponse(
        c.getId(),
        c.getName(),
        c.getIncludedOfferIds(),
        c.getDescription(),
        c.getIsPublished(),
        c.getComputedMetrics(),
        c.getCreatedAt(),
        c.getUpdatedAt());
  }
}
