package com.interntoolsfyi.paycheck.repository;

import com.interntoolsfyi.paycheck.model.PaycheckConfig;
import com.interntoolsfyi.user.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaycheckConfigRepository extends JpaRepository<PaycheckConfig, Long> {
  List<PaycheckConfig> findByUserOrderByCreatedAtDesc(User user);

  Optional<PaycheckConfig> findByIdAndUser(Long id, User user);
}
