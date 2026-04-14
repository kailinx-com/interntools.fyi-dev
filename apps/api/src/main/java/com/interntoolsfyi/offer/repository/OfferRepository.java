package com.interntoolsfyi.offer.repository;

import com.interntoolsfyi.offer.model.Offer;
import com.interntoolsfyi.user.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface OfferRepository extends JpaRepository<Offer, Long>, JpaSpecificationExecutor<Offer> {
  List<Offer> findByUserOrderByUpdatedAtDesc(User user);

  Optional<Offer> findByIdAndUser(Long id, User user);
}
