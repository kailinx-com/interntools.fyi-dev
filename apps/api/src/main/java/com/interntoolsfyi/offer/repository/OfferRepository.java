package com.interntoolsfyi.offer.repository;

import com.interntoolsfyi.offer.model.Offer;
import com.interntoolsfyi.user.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OfferRepository extends JpaRepository<Offer, Long> {
  List<Offer> findByUserOrderByUpdatedAtDesc(User user);

  Optional<Offer> findByIdAndUser(Long id, User user);
}
