package com.interntoolsfyi.paycheck.repository;

import com.interntoolsfyi.paycheck.model.PaycheckSavedPlan;
import com.interntoolsfyi.user.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaycheckSavedPlanRepository extends JpaRepository<PaycheckSavedPlan, Long> {
  List<PaycheckSavedPlan> findByUserOrderByUpdatedAtDesc(User user);

  Optional<PaycheckSavedPlan> findByIdAndUser(Long id, User user);
}
