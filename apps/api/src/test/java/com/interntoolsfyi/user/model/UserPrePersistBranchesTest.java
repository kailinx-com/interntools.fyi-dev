package com.interntoolsfyi.user.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class UserPrePersistBranchesTest {

  @Test
  void onCreateSetsCreatedAtWhenNull() {
    User user = new User("u", "u@example.com", "h", Role.STUDENT, "A", "B");
    user.onCreate();
    assertThat(user.getCreatedAt()).isNotNull();
  }

  @Test
  void onCreatePreservesCreatedAtWhenAlreadySet() {
    User user = new User("u", "u@example.com", "h", Role.STUDENT, "A", "B");
    Instant past = Instant.parse("2020-01-01T00:00:00Z");
    ReflectionTestUtils.setField(user, "createdAt", past);
    user.onCreate();
    assertThat(user.getCreatedAt()).isEqualTo(past);
  }
}
