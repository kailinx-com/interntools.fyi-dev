package com.interntoolsfyi.paycheck.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.interntoolsfyi.paycheck.model.PaycheckSavedPlan;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;

@DataJpaTest
@ActiveProfiles("test")
class PaycheckSavedPlanRepositoryTest {

  @Autowired private PaycheckSavedPlanRepository savedPlanRepository;
  @Autowired private UserRepository userRepository;

  @Nested
  @DisplayName("findByUserOrderByUpdatedAtDesc")
  class FindByUserOrderByUpdatedAtDescTests {

    @Test
    @DisplayName("returns only the given users plans ordered newest updatedAt first")
    void returnsOnlyGivenUsersPlansByUpdatedAtDesc() {
      User owner = userRepository.saveAndFlush(createUser("plan-owner", "plan-owner@example.com"));
      User other = userRepository.saveAndFlush(createUser("plan-other", "plan-other@example.com"));

      PaycheckSavedPlan older = savePlan(owner, "Older plan", Instant.parse("2026-01-01T00:00:00Z"));
      PaycheckSavedPlan newer = savePlan(owner, "Newer plan", Instant.parse("2026-04-01T00:00:00Z"));
      savePlan(other, "Other user plan", Instant.parse("2026-05-01T00:00:00Z"));

      List<PaycheckSavedPlan> result = savedPlanRepository.findByUserOrderByUpdatedAtDesc(owner);

      assertThat(result).extracting(PaycheckSavedPlan::getId)
          .containsExactly(newer.getId(), older.getId());
    }

    @Test
    @DisplayName("returns empty list when user has no saved plans")
    void returnsEmptyListForUserWithNoPlans() {
      User emptyUser = userRepository.saveAndFlush(createUser("no-plans-user", "no-plans@example.com"));

      assertThat(savedPlanRepository.findByUserOrderByUpdatedAtDesc(emptyUser)).isEmpty();
    }
  }

  @Nested
  @DisplayName("findByIdAndUser")
  class FindByIdAndUserTests {

    @Test
    @DisplayName("returns the plan when it belongs to the given user")
    void returnsPlanForOwner() {
      User owner = userRepository.saveAndFlush(createUser("plan-owner2", "plan-owner2@example.com"));
      PaycheckSavedPlan plan = savePlan(owner, "My plan", Instant.parse("2026-02-01T00:00:00Z"));

      assertThat(savedPlanRepository.findByIdAndUser(plan.getId(), owner)).isPresent();
    }

    @Test
    @DisplayName("returns empty when the plan belongs to a different user")
    void returnsEmptyForNonOwner() {
      User owner = userRepository.saveAndFlush(createUser("plan-owner3", "plan-owner3@example.com"));
      User other = userRepository.saveAndFlush(createUser("plan-other3", "plan-other3@example.com"));
      PaycheckSavedPlan plan = savePlan(owner, "Private plan", Instant.parse("2026-02-01T00:00:00Z"));

      assertThat(savedPlanRepository.findByIdAndUser(plan.getId(), other)).isEmpty();
    }

    @Test
    @DisplayName("returns empty for a non-existent id")
    void returnsEmptyForNonExistentId() {
      User owner = userRepository.saveAndFlush(createUser("plan-owner4", "plan-owner4@example.com"));

      assertThat(savedPlanRepository.findByIdAndUser(Long.MAX_VALUE, owner)).isEmpty();
    }
  }

  private PaycheckSavedPlan savePlan(User user, String name, Instant updatedAt) {
    PaycheckSavedPlan plan = new PaycheckSavedPlan();
    plan.setUser(user);
    plan.setName(name);
    plan.setConfigJson("{\"state\":\"CA\"}");
    plan.setPlannerDataJson("{\"expenses\":[]}");
    ReflectionTestUtils.setField(plan, "updatedAt", updatedAt);
    return savedPlanRepository.saveAndFlush(plan);
  }

  private static User createUser(String username, String email) {
    return new User(username, email, "hashed-password", Role.STUDENT, "Test", "User");
  }
}
