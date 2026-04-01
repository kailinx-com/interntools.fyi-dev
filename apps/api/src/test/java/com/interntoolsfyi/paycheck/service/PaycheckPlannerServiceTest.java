package com.interntoolsfyi.paycheck.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.interntoolsfyi.paycheck.dto.PlannerDetailResponse;
import com.interntoolsfyi.paycheck.dto.SavePlannerRequest;
import com.interntoolsfyi.paycheck.model.PlannerDocument;
import com.interntoolsfyi.paycheck.repository.PlannerDocumentRepository;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.util.Map;
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
class PaycheckPlannerServiceTest {

  @Mock private PlannerDocumentRepository plannerDocumentRepository;
  @Mock private UserRepository userRepository;

  @InjectMocks private PaycheckPlannerService paycheckPlannerService;

  @Nested
  @DisplayName("createPlanner")
  class CreatePlannerTests {

    @Test
    @DisplayName("persists only planner expenses and returns the created response")
    void persistsOnlyPlannerExpensesAndReturnsTheCreatedResponse() {
      User user = createUser("planner-user");
      Authentication authentication = authenticatedUser(user.getUsername());
      Map<String, Object> expenses =
          Map.of(
              "expenses",
              java.util.List.of(
                  Map.of(
                      "id", "rent",
                      "name", "Rent",
                      "defaultAmount", 1800,
                      "overrides", Map.of())));
      Map<String, Object> data =
          Map.of(
              "months",
              java.util.List.of(Map.of("key", "2026-05", "label", "May 2026", "netPay", 5000)),
              "expenses",
              expenses.get("expenses"));

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(plannerDocumentRepository.save(any(PlannerDocument.class)))
          .thenAnswer(
              invocation -> {
                PlannerDocument saved = invocation.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", "planner-123");
                return saved;
              });

      PlannerDetailResponse response =
          paycheckPlannerService.createPlanner(
              authentication, new SavePlannerRequest("  Spring budget  ", data));

      ArgumentCaptor<PlannerDocument> savedCaptor = ArgumentCaptor.forClass(PlannerDocument.class);
      verify(plannerDocumentRepository).save(savedCaptor.capture());
      PlannerDocument saved = savedCaptor.getValue();

      assertThat(saved.getUser()).isSameAs(user);
      assertThat(saved.getName()).isEqualTo("Spring budget");
      assertThat(saved.getData()).isEqualTo(expenses);

      assertThat(response.id()).isEqualTo("planner-123");
      assertThat(response.name()).isEqualTo("Spring budget");
      assertThat(response.data()).isEqualTo(expenses);
    }

    @Test
    @DisplayName("returns bad request when the planner name is null")
    void returnsBadRequestWhenThePlannerNameIsNull() {
      User user = createUser("null-name-user");
      Authentication authentication = authenticatedUser(user.getUsername());

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));

      assertThatThrownBy(
              () ->
                  paycheckPlannerService.createPlanner(
                      authentication, new SavePlannerRequest(null, Map.of("expenses", java.util.List.of()))))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              exception -> {
                assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                assertThat(exception.getReason()).isEqualTo("name is required");
              });

      verify(plannerDocumentRepository, never()).save(any(PlannerDocument.class));
    }

    @Test
    @DisplayName("stores an empty object when the planner payload is null")
    void storesAnEmptyObjectWhenThePlannerPayloadIsNull() {
      User user = createUser("empty-planner-user");
      Authentication authentication = authenticatedUser(user.getUsername());

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(plannerDocumentRepository.save(any(PlannerDocument.class)))
          .thenAnswer(
              invocation -> {
                PlannerDocument saved = invocation.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", "planner-empty");
                return saved;
              });

      PlannerDetailResponse response =
          paycheckPlannerService.createPlanner(
              authentication, new SavePlannerRequest("Empty plan", null));

      ArgumentCaptor<PlannerDocument> savedCaptor = ArgumentCaptor.forClass(PlannerDocument.class);
      verify(plannerDocumentRepository).save(savedCaptor.capture());

      assertThat(savedCaptor.getValue().getData()).isEmpty();
      assertThat(response.id()).isEqualTo("planner-empty");
      assertThat(response.data()).isEmpty();
    }
  }

  private static Authentication authenticatedUser(String username) {
    Authentication authentication = org.mockito.Mockito.mock(Authentication.class);
    when(authentication.isAuthenticated()).thenReturn(true);
    when(authentication.getName()).thenReturn(username);
    return authentication;
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
}
