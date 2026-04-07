package com.interntoolsfyi.offer.service;

import com.interntoolsfyi.offer.dto.OfferRequest;
import com.interntoolsfyi.offer.dto.OfferResponse;
import com.interntoolsfyi.offer.model.Offer;
import com.interntoolsfyi.offer.repository.OfferRepository;
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
public class OfferService {

  private final OfferRepository offerRepository;
  private final UserRepository userRepository;

  public OfferService(OfferRepository offerRepository, UserRepository userRepository) {
    this.offerRepository = offerRepository;
    this.userRepository = userRepository;
  }

  @Transactional(readOnly = true)
  public List<OfferResponse> listOffers(Authentication auth) {
    User user = requireUser(auth);
    return offerRepository.findByUserOrderByUpdatedAtDesc(user).stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional
  public OfferResponse createOffer(Authentication auth, OfferRequest request) {
    User user = requireUser(auth);
    Offer offer = new Offer();
    offer.setUser(user);
    applyRequest(offer, request);
    offer.setUpdatedAt(Instant.now());
    return toResponse(offerRepository.save(offer));
  }

  @Transactional(readOnly = true)
  public OfferResponse getOffer(Authentication auth, Long id) {
    User user = requireUser(auth);
    return toResponse(requireOwned(id, user));
  }

  @Transactional
  public OfferResponse updateOffer(Authentication auth, Long id, OfferRequest request) {
    User user = requireUser(auth);
    Offer offer = requireOwned(id, user);
    applyRequest(offer, request);
    offer.setUpdatedAt(Instant.now());
    return toResponse(offerRepository.save(offer));
  }

  @Transactional
  public void deleteOffer(Authentication auth, Long id) {
    User user = requireUser(auth);
    Offer offer = requireOwned(id, user);
    offerRepository.delete(offer);
  }

  private void applyRequest(Offer offer, OfferRequest req) {
    offer.setCompany(req.company());
    offer.setTitle(req.title());
    offer.setEmploymentType(req.employmentType());
    offer.setCompensationType(req.compensationType());
    offer.setPayAmount(req.payAmount());
    offer.setHoursPerWeek(req.hoursPerWeek());
    offer.setSignOnBonus(req.signOnBonus());
    offer.setRelocationAmount(req.relocationAmount());
    offer.setEquityNotes(req.equityNotes());
    offer.setOfficeLocation(req.officeLocation());
    offer.setDaysInOffice(req.daysInOffice());
    offer.setNotes(req.notes());
    offer.setFavorite(req.favorite());
  }

  private Offer requireOwned(Long id, User user) {
    return offerRepository
        .findByIdAndUser(id, user)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Offer not found"));
  }

  private User requireUser(Authentication auth) {
    if (auth == null || !auth.isAuthenticated()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }
    return userRepository
        .findByUsername(auth.getName())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
  }

  private OfferResponse toResponse(Offer o) {
    return new OfferResponse(
        o.getId(),
        o.getCompany(),
        o.getTitle(),
        o.getEmploymentType(),
        o.getCompensationType(),
        o.getPayAmount(),
        o.getHoursPerWeek(),
        o.getSignOnBonus(),
        o.getRelocationAmount(),
        o.getEquityNotes(),
        o.getOfficeLocation(),
        o.getDaysInOffice(),
        o.getNotes(),
        o.getFavorite(),
        o.getCreatedAt(),
        o.getUpdatedAt());
  }
}
