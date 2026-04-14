package com.interntoolsfyi.offer.repository;

import com.interntoolsfyi.offer.model.Comparison;
import com.interntoolsfyi.user.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComparisonRepository extends JpaRepository<Comparison, Long> {
  List<Comparison> findByUserOrderByCreatedAtDesc(User user);

  Optional<Comparison> findByIdAndUser(Long id, User user);

  List<Comparison> findByIsPublishedTrue();
}
