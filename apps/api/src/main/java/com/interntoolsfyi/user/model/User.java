package com.interntoolsfyi.user.model;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "users")
public class User {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Getter
  private Long id;

  @Column(nullable = false, unique = true)
  @Getter
  @Setter
  private String username;

  @Column(nullable = false, unique = true)
  @Getter
  @Setter
  private String email;

  @Column(name = "password_hash", nullable = false)
  @Getter
  @Setter
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
    this.firstName = firstName;
    this.lastName = lastName;
  }

  @PrePersist
  void onCreate() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }
}
