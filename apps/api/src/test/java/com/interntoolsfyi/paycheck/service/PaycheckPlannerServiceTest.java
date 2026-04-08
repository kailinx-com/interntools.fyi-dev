package com.interntoolsfyi.paycheck.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.interntoolsfyi.paycheck.dto.PlannerDetailResponse;
import com.interntoolsfyi.paycheck.dto.PlannerSummaryResponse;
import com.interntoolsfyi.paycheck.dto.SavePlannerRequest;
import com.interntoolsfyi.paycheck.model.PlannerDocument;
import com.interntoolsfyi.paycheck.repository.PlannerDocumentRepository;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.time.Instant;
import java.util.List;
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

    @Test
    @DisplayName("stores empty map when expenses list is empty (normalizeData branch)")
    void storesEmptyMapWhenExpensesListIsEmpty() {
      User user = createUser("empty-expenses-user");
      Authentication authentication = authenticatedUser(user.getUsername());
      Map<String, Object> data = Map.of("expenses", List.of());

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(plannerDocumentRepository.save(any(PlannerDocument.class)))
          .thenAnswer(
              invocation -> {
                PlannerDocument saved = invocation.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", "planner-empty-exp");
                return saved;
              });

      PlannerDetailResponse response =
          paycheckPlannerService.createPlanner(
              authentication, new SavePlannerRequest("Only months", data));

      ArgumentCaptor<PlannerDocument> savedCaptor = ArgumentCaptor.forClass(PlannerDocument.class);
      verify(plannerDocumentRepository).save(savedCaptor.capture());
      assertThat(savedCaptor.getValue().getData()).isEmpty();
      assertThat(response.data()).isEmpty();
    }

    @Test
    @DisplayName("stores empty map when expenses is not a list (normalizeData branch)")
    void storesEmptyMapWhenExpensesIsNotAList() {
      User user = createUser("non-list-expenses");
      Authentication authentication = authenticatedUser(user.getUsername());
      Map<String, Object> data = Map.of("expenses", "not-a-list");

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(plannerDocumentRepository.save(any(PlannerDocument.class)))
          .thenAnswer(
              invocation -> {
                PlannerDocument saved = invocation.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", "planner-nonlist");
                return saved;
              });

      paycheckPlannerService.createPlanner(
          authentication, new SavePlannerRequest("Weird expenses", data));

      ArgumentCaptor<PlannerDocument> savedCaptor = ArgumentCaptor.forClass(PlannerDocument.class);
      verify(plannerDocumentRepository).save(savedCaptor.capture());
      assertThat(savedCaptor.getValue().getData()).isEmpty();
    }
  }

  @Nested
  @DisplayName("getPlanner")
  class GetPlannerTests {

    @Test
    @DisplayName("returns detail when the planner belongs to the current user")
    void returnsDetailWhenPlannerBelongsToUser() {
      User user = createUser("getter");
      Authentication authentication = authenticatedUser(user.getUsername());
      PlannerDocument doc = new PlannerDocument();
      doc.setName("My plan");
      doc.setUser(user);
      ReflectionTestUtils.setField(doc, "id", "p-1");
      doc.setData(Map.of("expenses", List.of(Map.of("id", "x"))));

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(plannerDocumentRepository.findByIdAndUser("p-1", user)).thenReturn(Optional.of(doc));

      PlannerDetailResponse response = paycheckPlannerService.getPlanner(authentication, "p-1");

      assertThat(response.id()).isEqualTo("p-1");
      assertThat(response.name()).isEqualTo("My plan");
      assertThat(response.data()).isEqualTo(doc.getData());
    }

    @Test
    @DisplayName("returns 404 when the planner is not found")
    void returnsNotFoundWhenMissing() {
      User user = createUser("missing");
      Authentication authentication = authenticatedUser(user.getUsername());
      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(plannerDocumentRepository.findByIdAndUser("nope", user)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> paycheckPlannerService.getPlanner(authentication, "nope"))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> {
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                assertThat(ex.getReason()).contains("Scenario not found");
              });
    }
  }

  @Nested
  @DisplayName("getAllPlanners")
  class GetAllPlannersTests {

    @Test
    @DisplayName("returns summaries ordered by repository")
    void returnsSummaries() {
      User user = createUser("lister");
      Authentication authentication = authenticatedUser(user.getUsername());
      Instant t1 = Instant.parse("2026-01-01T00:00:00Z");
      PlannerDocument a = new PlannerDocument();
      a.setName("A");
      a.setUser(user);
      ReflectionTestUtils.setField(a, "id", "a");
      ReflectionTestUtils.setField(a, "createdAt", t1);
      PlannerDocument b = new PlannerDocument();
      b.setName("B");
      b.setUser(user);
      ReflectionTestUtils.setField(b, "id", "b");
      ReflectionTestUtils.setField(b, "createdAt", Instant.parse("2026-02-01T00:00:00Z"));

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(plannerDocumentRepository.findByUserOrderByCreatedAtDesc(user)).thenReturn(List.of(b, a));

      List<PlannerSummaryResponse> list = paycheckPlannerService.getAllPlanners(authentication);

      assertThat(list).hasSize(2);
      assertThat(list.getFirst().id()).isEqualTo("b");
      assertThat(list.getFirst().name()).isEqualTo("B");
    }
  }

  @Nested
  @DisplayName("deletePlanner")
  class DeletePlannerTests {

    @Test
    @DisplayName("deletes when planner exists for user")
    void deletesWhenFound() {
      User user = createUser("deleter");
      Authentication authentication = authenticatedUser(user.getUsername());
      PlannerDocument doc = new PlannerDocument();
      doc.setName("X");
      doc.setUser(user);
      ReflectionTestUtils.setField(doc, "id", "del-1");

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(plannerDocumentRepository.findByIdAndUser("del-1", user)).thenReturn(Optional.of(doc));

      paycheckPlannerService.deletePlanner(authentication, "del-1");

      verify(plannerDocumentRepository).delete(doc);
    }

    @Test
    @DisplayName("returns 404 when planner is missing")
    void returnsNotFoundWhenMissing() {
      User user = createUser("deleter-miss");
      Authentication authentication = authenticatedUser(user.getUsername());
      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(plannerDocumentRepository.findByIdAndUser("x", user)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> paycheckPlannerService.deletePlanner(authentication, "x"))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }
  }

  @Nested
  @DisplayName("requireCurrentUser")
  class RequireCurrentUserTests {

    @Test
    @DisplayName("throws unauthorized when authentication is null")
    void unauthorizedWhenNull() {
      assertThatThrownBy(
              () ->
                  paycheckPlannerService.createPlanner(
                      null, new SavePlannerRequest("n", Map.of())))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    @DisplayName("throws unauthorized when not authenticated")
    void unauthorizedWhenNotAuthenticated() {
      Authentication authentication = org.mockito.Mockito.mock(Authentication.class);
      when(authentication.isAuthenticated()).thenReturn(false);

      assertThatThrownBy(
              () ->
                  paycheckPlannerService.createPlanner(
                      authentication, new SavePlannerRequest("n", Map.of())))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    @DisplayName("throws unauthorized when user record is missing")
    void unauthorizedWhenUserMissingInDb() {
      Authentication authentication = authenticatedUser("ghost");
      when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

      assertThatThrownBy(
              () ->
                  paycheckPlannerService.createPlanner(
                      authentication, new SavePlannerRequest("n", Map.of())))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
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
