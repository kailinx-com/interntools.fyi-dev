package com.interntoolsfyi.offer.controller;

import com.interntoolsfyi.offer.dto.OfferRequest;
import com.interntoolsfyi.offer.dto.OfferResponse;
import com.interntoolsfyi.offer.service.OfferService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/offers")
public class OfferController {

  private final OfferService offerService;

  public OfferController(OfferService offerService) {
    this.offerService = offerService;
  }

  @GetMapping
  public List<OfferResponse> listOffers(Authentication auth) {
    return offerService.listOffers(auth);
  }

  @GetMapping("/by-office-location")
  public List<OfferResponse> listOffersByOfficeLocation(
      @RequestParam(name = "tokens") List<String> tokens) {
    return offerService.listOffersByOfficeLocationTokens(tokens);
  }

  @PostMapping(consumes = "application/json")
  @ResponseStatus(HttpStatus.CREATED)
  public OfferResponse createOffer(
      Authentication auth, @Valid @RequestBody OfferRequest request) {
    return offerService.createOffer(auth, request);
  }

  @GetMapping("/{id}")
  public OfferResponse getOffer(Authentication auth, @PathVariable Long id) {
    return offerService.getOffer(auth, id);
  }

  @PatchMapping(value = "/{id}", consumes = "application/json")
  public OfferResponse updateOffer(
      Authentication auth, @PathVariable Long id, @Valid @RequestBody OfferRequest request) {
    return offerService.updateOffer(auth, id, request);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteOffer(Authentication auth, @PathVariable Long id) {
    offerService.deleteOffer(auth, id);
  }
}
