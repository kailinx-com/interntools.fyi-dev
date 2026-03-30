package com.interntoolsfyi.paycheck.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.interntoolsfyi.paycheck.model.PaycheckConfig;
import com.interntoolsfyi.paycheck.model.State;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;

@DataJpaTest
@ActiveProfiles("test")
class PaycheckConfigRepositoryTest {

  @Autowired private PaycheckConfigRepository paycheckConfigRepository;
  @Autowired private UserRepository userRepository;

  @Test
  @DisplayName("save persists a paycheck scenario, assigns an id, and stores all mapped fields")
  void savePersistsAPaycheckScenarioAssignsAnIdAndStoresAllMappedFields() {
    User user = userRepository.saveAndFlush(createUser("scenario-owner"));

    PaycheckConfig saved =
        paycheckConfigRepository.saveAndFlush(
            createScenario(user, "Summer role", Instant.parse("2026-03-28T09:00:00Z")));

    assertThat(saved.getId()).isNotNull();
    assertThat(saved.getCreatedAt()).isEqualTo(Instant.parse("2026-03-28T09:00:00Z"));
    assertThat(saved.getName()).isEqualTo("Summer role");
    assertThat(saved.getUser().getUsername()).isEqualTo("scenario-owner");
    assertThat(saved.getStartDate()).isEqualTo(LocalDate.of(2026, 6, 1));
    assertThat(saved.getEndDate()).isEqualTo(LocalDate.of(2026, 8, 21));
    assertThat(saved.getState()).isEqualTo(State.CA);
    assertThat(saved.getHourlyRate()).isEqualTo(32.5f);
    assertThat(saved.getWorkHoursPerDay()).isEqualTo(8);
    assertThat(saved.getWorkDaysPerWeek()).isEqualTo(5);
    assertThat(saved.getStipendPerWeek()).isEqualTo(125.0f);
    assertThat(saved.getResidency()).isEqualTo("nonresident");
    assertThat(saved.getVisaType()).isEqualTo("F1");
    assertThat(saved.getArrivalYear()).isEqualTo(2024);
    assertThat(saved.getFicaMode()).isEqualTo("student-exempt");
  }

  @Nested
  @DisplayName("finder queries")
  class FinderQueryTests {

    @Test
    @DisplayName("findByUserOrderByCreatedAtDesc returns only that users scenarios in descending created time order")
    void findByUserOrderByCreatedAtDescReturnsOnlyThatUsersScenariosInDescendingCreatedTimeOrder() {
      User firstUser = userRepository.saveAndFlush(createUser("primary-user"));
      User secondUser = userRepository.saveAndFlush(createUser("other-user"));

      PaycheckConfig older =
          paycheckConfigRepository.saveAndFlush(
              createScenario(firstUser, "Older scenario", Instant.parse("2026-03-01T00:00:00Z")));
      PaycheckConfig newest =
          paycheckConfigRepository.saveAndFlush(
              createScenario(firstUser, "Newest scenario", Instant.parse("2026-04-01T00:00:00Z")));
      paycheckConfigRepository.saveAndFlush(
          createScenario(secondUser, "Other users scenario", Instant.parse("2026-05-01T00:00:00Z")));

      assertThat(paycheckConfigRepository.findByUserOrderByCreatedAtDesc(firstUser))
          .extracting(PaycheckConfig::getId, PaycheckConfig::getName, PaycheckConfig::getUser)
          .containsExactly(
              org.assertj.core.groups.Tuple.tuple(newest.getId(), "Newest scenario", firstUser),
              org.assertj.core.groups.Tuple.tuple(older.getId(), "Older scenario", firstUser));
    }

    @Test
    @DisplayName("findByIdAndUser returns the scenario only for its owner")
    void findByIdAndUserReturnsTheScenarioOnlyForItsOwner() {
      User owner = userRepository.saveAndFlush(createUser("owner"));
      User differentUser = userRepository.saveAndFlush(createUser("different-user"));
      PaycheckConfig scenario =
          paycheckConfigRepository.saveAndFlush(
              createScenario(owner, "Protected scenario", Instant.parse("2026-03-20T14:00:00Z")));

      PaycheckConfig found = paycheckConfigRepository.findByIdAndUser(scenario.getId(), owner).orElseThrow();

      assertThat(found.getName()).isEqualTo("Protected scenario");
      assertThat(found.getUser()).isEqualTo(owner);

      assertThat(paycheckConfigRepository.findByIdAndUser(scenario.getId(), differentUser)).isEmpty();
      assertThat(paycheckConfigRepository.findByIdAndUser(Long.MAX_VALUE, owner)).isEmpty();
    }
  }

  private static User createUser(String username) {
    return new User(
        username,
        username + "@example.com",
        "hashed-password",
        Role.STUDENT,
        "Test",
        "User");
  }

  private static PaycheckConfig createScenario(User user, String name, Instant createdAt) {
    PaycheckConfig scenario = new PaycheckConfig();
    scenario.setName(name);
    scenario.setUser(user);
    scenario.setStartDate(LocalDate.of(2026, 6, 1));
    scenario.setEndDate(LocalDate.of(2026, 8, 21));
    scenario.setState(State.CA);
    scenario.setHourlyRate(32.5f);
    scenario.setWorkHoursPerDay(8);
    scenario.setWorkDaysPerWeek(5);
    scenario.setStipendPerWeek(125.0f);
    scenario.setResidency("nonresident");
    scenario.setVisaType("F1");
    scenario.setArrivalYear(2024);
    scenario.setFicaMode("student-exempt");
    ReflectionTestUtils.setField(scenario, "createdAt", createdAt);
    return scenario;
  }
}
