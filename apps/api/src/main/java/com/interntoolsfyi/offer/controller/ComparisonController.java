package com.interntoolsfyi.offer.controller;

import com.interntoolsfyi.offer.dto.ComparisonRequest;
import com.interntoolsfyi.offer.dto.ComparisonResponse;
import com.interntoolsfyi.offer.service.ComparisonService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/comparisons")
public class ComparisonController {

  private final ComparisonService comparisonService;

  public ComparisonController(ComparisonService comparisonService) {
    this.comparisonService = comparisonService;
  }

  @GetMapping
  public List<ComparisonResponse> listComparisons(Authentication auth) {
    return comparisonService.listComparisons(auth);
  }

  @PostMapping(consumes = "application/json")
  @ResponseStatus(HttpStatus.CREATED)
  public ComparisonResponse createComparison(
      Authentication auth, @Valid @RequestBody ComparisonRequest request) {
    return comparisonService.createComparison(auth, request);
  }

  @GetMapping("/{id}")
  public ComparisonResponse getComparison(Authentication auth, @PathVariable Long id) {
    return comparisonService.getComparison(auth, id);
  }

  @PatchMapping(value = "/{id}", consumes = "application/json")
  public ComparisonResponse updateComparison(
      Authentication auth, @PathVariable Long id, @Valid @RequestBody ComparisonRequest request) {
    return comparisonService.updateComparison(auth, id, request);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteComparison(Authentication auth, @PathVariable Long id) {
    comparisonService.deleteComparison(auth, id);
  }
}
