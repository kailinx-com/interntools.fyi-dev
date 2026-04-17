package com.interntoolsfyi.user.model;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import org.junit.jupiter.api.Test;

class UserRoleModelContractTest {

  @Test
  void roleEnumDefinesAtLeastTwoDistinctKinds() {
    assertThat(Role.values()).hasSize(2).containsExactlyInAnyOrder(Role.STUDENT, Role.ADMIN);
  }

  @Test
  void userMapsToSingleTableNamedUsers() {
    assertThat(User.class.getAnnotation(Entity.class)).isNotNull();
    assertThat(User.class.getAnnotation(Table.class).name()).isEqualTo("users");
  }

  @Test
  void userRoleIsEnumeratedStringColumnOnSameEntity() throws Exception {
    var roleField = User.class.getDeclaredField("role");
    assertThat(roleField.getType()).isEqualTo(Role.class);
    Enumerated enumerated = roleField.getAnnotation(Enumerated.class);
    assertThat(enumerated).isNotNull();
    assertThat(enumerated.value()).isEqualTo(EnumType.STRING);
  }
}
