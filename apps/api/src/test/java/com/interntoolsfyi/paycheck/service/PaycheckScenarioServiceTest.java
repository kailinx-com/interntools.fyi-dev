package com.interntoolsfyi.paycheck.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.interntoolsfyi.paycheck.dto.PaycheckConfigDto;
import com.interntoolsfyi.paycheck.dto.SaveScenarioRequest;
import com.interntoolsfyi.paycheck.dto.ScenarioDetailResponse;
import com.interntoolsfyi.paycheck.dto.ScenarioSummaryResponse;
import com.interntoolsfyi.paycheck.model.PaycheckConfig;
import com.interntoolsfyi.paycheck.model.State;
import com.interntoolsfyi.paycheck.repository.PaycheckConfigRepository;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class PaycheckScenarioServiceTest {

  @Mock private PaycheckConfigRepository paycheckConfigRepository;
  @Mock private UserRepository userRepository;

  @InjectMocks private PaycheckScenarioService paycheckScenarioService;

  @Nested
  @DisplayName("createScenario")
  class CreateScenarioTests {

    @Test
    @DisplayName("persists the mapped config fields and returns the created detail response")
    void persistsTheMappedConfigFieldsAndReturnsTheCreatedDetailResponse() {
      User user = createUser("paycheck-user");
      Authentication authentication = authenticatedUser(user.getUsername());
      SaveScenarioRequest request = createRequest("Summer internship", createConfig());
      Instant createdAt = Instant.parse("2026-03-28T10:15:30Z");

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(paycheckConfigRepository.save(any(PaycheckConfig.class)))
          .thenAnswer(
              invocation -> {
                PaycheckConfig saved = invocation.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", 41L);
                ReflectionTestUtils.setField(saved, "createdAt", createdAt);
                return saved;
              });

      ScenarioDetailResponse response =
          paycheckScenarioService.createScenario(authentication, request);

      ArgumentCaptor<PaycheckConfig> savedCaptor = ArgumentCaptor.forClass(PaycheckConfig.class);
      verify(paycheckConfigRepository).save(savedCaptor.capture());
      PaycheckConfig savedConfig = savedCaptor.getValue();

      assertThat(savedConfig.getName()).isEqualTo("Summer internship");
      assertThat(savedConfig.getUser()).isSameAs(user);
      assertThat(savedConfig.getStartDate()).isEqualTo(LocalDate.of(2026, 6, 1));
      assertThat(savedConfig.getEndDate()).isEqualTo(LocalDate.of(2026, 8, 21));
      assertThat(savedConfig.getState()).isEqualTo(State.CA);
      assertThat(savedConfig.getHourlyRate()).isEqualTo(32.5f);
      assertThat(savedConfig.getWorkHoursPerDay()).isEqualTo(8);
      assertThat(savedConfig.getWorkDaysPerWeek()).isEqualTo(5);
      assertThat(savedConfig.getStipendPerWeek()).isEqualTo(125.0f);
      assertThat(savedConfig.getResidency()).isEqualTo("nonresident");
      assertThat(savedConfig.getVisaType()).isEqualTo("F1");
      assertThat(savedConfig.getArrivalYear()).isEqualTo(2024);
      assertThat(savedConfig.getFicaMode()).isEqualTo("student-exempt");

      assertThat(response.id()).isEqualTo(41L);
      assertThat(response.name()).isEqualTo("Summer internship");
      assertThat(response.createdAt()).isEqualTo(createdAt);
      assertThat(response.config())
          .usingRecursiveComparison()
          .isEqualTo(request.config());
    }

    @Test
    @DisplayName("trims the scenario name before saving")
    void trimsTheScenarioNameBeforeSaving() {
      User user = createUser("trim-user");
      Authentication authentication = authenticatedUser(user.getUsername());
      SaveScenarioRequest request = createRequest("  Trim me  ", createConfig());

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(paycheckConfigRepository.save(any(PaycheckConfig.class)))
          .thenAnswer(invocation -> invocation.getArgument(0));

      paycheckScenarioService.createScenario(authentication, request);

      ArgumentCaptor<PaycheckConfig> savedCaptor = ArgumentCaptor.forClass(PaycheckConfig.class);
      verify(paycheckConfigRepository).save(savedCaptor.capture());
      assertThat(savedCaptor.getValue().getName()).isEqualTo("Trim me");
    }

    @Test
    @DisplayName("returns bad request when the trimmed scenario name is empty")
    void returnsBadRequestWhenTheTrimmedScenarioNameIsEmpty() {
      User user = createUser("blank-name-user");
      Authentication authentication = authenticatedUser(user.getUsername());

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));

      assertThatThrownBy(
              () ->
                  paycheckScenarioService.createScenario(
                      authentication, createRequest("   ", createConfig())))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              exception -> {
                assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                assertThat(exception.getReason()).isEqualTo("name is required");
              });

      verify(paycheckConfigRepository, never()).save(any(PaycheckConfig.class));
    }

    @Test
    @DisplayName("returns bad request when the scenario name is null")
    void returnsBadRequestWhenTheScenarioNameIsNull() {
      User user = createUser("null-name-user");
      Authentication authentication = authenticatedUser(user.getUsername());

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));

      assertThatThrownBy(
              () -> paycheckScenarioService.createScenario(authentication, createRequest(null, createConfig())))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              exception -> {
                assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                assertThat(exception.getReason()).isEqualTo("name is required");
              });

      verify(paycheckConfigRepository, never()).save(any(PaycheckConfig.class));
    }
  }

  @Nested
  @DisplayName("authentication")
  class AuthenticationTests {

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() {
      assertThatThrownBy(() -> paycheckScenarioService.getAllScenarios(null))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              exception -> {
                assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
                assertThat(exception.getReason()).isEqualTo("Authentication required");
              });
    }

    @Test
    @DisplayName("returns unauthorized when the authentication is not authenticated")
    void returnsUnauthorizedWhenTheAuthenticationIsNotAuthenticated() {
      Authentication authentication = unauthenticatedUser("guest");

      assertThatThrownBy(() -> paycheckScenarioService.getAllScenarios(authentication))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              exception -> {
                assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
                assertThat(exception.getReason()).isEqualTo("Authentication required");
              });
    }

    @Test
    @DisplayName("returns unauthorized when the authenticated principal no longer exists")
    void returnsUnauthorizedWhenTheAuthenticatedPrincipalNoLongerExists() {
      Authentication authentication = authenticatedUser("missing-user");

      when(userRepository.findByUsername("missing-user")).thenReturn(Optional.empty());

      assertThatThrownBy(() -> paycheckScenarioService.getAllScenarios(authentication))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              exception -> {
                assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
                assertThat(exception.getReason()).isEqualTo("Authenticated user not found");
              });
    }
  }

  @Nested
  @DisplayName("getAllScenarios")
  class GetAllScenariosTests {

    @Test
    @DisplayName("returns scenario summaries in repository order for the current user")
    void returnsScenarioSummariesInRepositoryOrderForTheCurrentUser() {
      User user = createUser("summary-user");
      Authentication authentication = authenticatedUser(user.getUsername());
      PaycheckConfig newest = createScenario(user, 10L, "Newest", Instant.parse("2026-04-01T00:00:00Z"));
      PaycheckConfig older = createScenario(user, 9L, "Older", Instant.parse("2026-03-01T00:00:00Z"));

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(paycheckConfigRepository.findByUserOrderByCreatedAtDesc(user))
          .thenReturn(List.of(newest, older));

      List<ScenarioSummaryResponse> response = paycheckScenarioService.getAllScenarios(authentication);

      assertThat(response)
          .extracting(ScenarioSummaryResponse::id, ScenarioSummaryResponse::name)
          .containsExactly(
              org.assertj.core.groups.Tuple.tuple(10L, "Newest"),
              org.assertj.core.groups.Tuple.tuple(9L, "Older"));
      assertThat(response)
          .extracting(ScenarioSummaryResponse::createdAt)
          .containsExactly(newest.getCreatedAt(), older.getCreatedAt());
    }
  }

  @Nested
  @DisplayName("getScenario")
  class GetScenarioTests {

    @Test
    @DisplayName("returns the detail response for a scenario owned by the current user")
    void returnsTheDetailResponseForAScenarioOwnedByTheCurrentUser() {
      User user = createUser("owner");
      Authentication authentication = authenticatedUser(user.getUsername());
      PaycheckConfig scenario = createScenario(user, 25L, "Owned scenario", Instant.parse("2026-03-29T11:30:00Z"));

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(paycheckConfigRepository.findByIdAndUser(25L, user)).thenReturn(Optional.of(scenario));

      ScenarioDetailResponse response = paycheckScenarioService.getScenario(authentication, 25L);

      assertThat(response.id()).isEqualTo(25L);
      assertThat(response.name()).isEqualTo("Owned scenario");
      assertThat(response.createdAt()).isEqualTo(scenario.getCreatedAt());
      assertThat(response.config().state()).isEqualTo(State.CA);
      assertThat(response.config().hourlyRate()).isEqualTo(32.5f);
    }

    @Test
    @DisplayName("returns not found when the scenario does not belong to the current user")
    void returnsNotFoundWhenTheScenarioDoesNotBelongToTheCurrentUser() {
      User user = createUser("owner");
      Authentication authentication = authenticatedUser(user.getUsername());

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(paycheckConfigRepository.findByIdAndUser(99L, user)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> paycheckScenarioService.getScenario(authentication, 99L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              exception -> {
                assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                assertThat(exception.getReason()).isEqualTo("Scenario not found with id: 99");
              });
    }
  }

  @Nested
  @DisplayName("deleteScenario")
  class DeleteScenarioTests {

    @Test
    @DisplayName("deletes a scenario owned by the current user")
    void deletesAScenarioOwnedByTheCurrentUser() {
      User user = createUser("owner");
      Authentication authentication = authenticatedUser(user.getUsername());
      PaycheckConfig scenario = createScenario(user, 66L, "Delete me", Instant.parse("2026-03-15T08:00:00Z"));

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(paycheckConfigRepository.findByIdAndUser(66L, user)).thenReturn(Optional.of(scenario));

      paycheckScenarioService.deleteScenario(authentication, 66L);

      verify(paycheckConfigRepository).delete(scenario);
    }

    @Test
    @DisplayName("returns not found when deleting a missing scenario")
    void returnsNotFoundWhenDeletingAMissingScenario() {
      User user = createUser("owner");
      Authentication authentication = authenticatedUser(user.getUsername());

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(paycheckConfigRepository.findByIdAndUser(404L, user)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> paycheckScenarioService.deleteScenario(authentication, 404L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              exception -> {
                assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                assertThat(exception.getReason()).isEqualTo("Scenario not found with id: 404");
              });

      verify(paycheckConfigRepository, never()).delete(any(PaycheckConfig.class));
    }
  }

  private static Authentication authenticatedUser(String username) {
    Authentication authentication = org.mockito.Mockito.mock(Authentication.class);
    when(authentication.isAuthenticated()).thenReturn(true);
    when(authentication.getName()).thenReturn(username);
    return authentication;
  }

  private static Authentication unauthenticatedUser(String username) {
    Authentication authentication = org.mockito.Mockito.mock(Authentication.class);
    when(authentication.isAuthenticated()).thenReturn(false);
    return authentication;
  }

  private static SaveScenarioRequest createRequest(String name, PaycheckConfigDto config) {
    return new SaveScenarioRequest(name, config);
  }

  private static PaycheckConfigDto createConfig() {
    return new PaycheckConfigDto(
        LocalDate.of(2026, 6, 1),
        LocalDate.of(2026, 8, 21),
        State.CA,
        32.5f,
        8,
        5,
        125.0f,
        "nonresident",
        "F1",
        2024,
        "student-exempt");
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

  private static PaycheckConfig createScenario(User user, Long id, String name, Instant createdAt) {
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
    ReflectionTestUtils.setField(scenario, "id", id);
    ReflectionTestUtils.setField(scenario, "createdAt", createdAt);
    return scenario;
  }
}
