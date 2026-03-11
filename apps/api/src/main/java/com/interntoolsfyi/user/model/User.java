package com.interntoolsfyi.user.model;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

/** User model for all users. * */
@Entity
@Table(name = "users")
public class User {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Getter
  private Long id;

  @Column(nullable = false, unique = true)
  @Getter
  private String username;

  @Column(nullable = false, unique = true)
  @Getter
  private String email;

  @Column(name = "password_hash", nullable = false)
  @Getter
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  @Getter
  @Setter
  private Role role;

  @Column(name = "created_at", nullable = false, updatable = false)
  @Getter
  private Instant createdAt;

  @Column(nullable = false)
  @Getter
  @Setter
  private String firstName;

  @Column(nullable = false)
  @Getter
  @Setter
  private String lastName;

  protected User() {}

  public User(
      String username,
      String email,
      String passwordHash,
      Role role,
      String firstName,
      String lastName) {
    this.username = username;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role;
    this.createdAt = Instant.now();
    this.firstName = firstName;
    this.lastName = lastName;
  }
}
