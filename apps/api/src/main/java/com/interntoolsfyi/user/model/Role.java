package com.interntoolsfyi.user.model;

/**
 * End-user authorization kind. At least two values are required; all share the same {@link User}
 * persistence model (single {@code users} table) — there are no separate JPA entities per role.
 */
public enum Role {
  STUDENT,
  ADMIN
}
