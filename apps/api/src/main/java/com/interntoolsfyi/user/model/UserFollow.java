package com.interntoolsfyi.user.model;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(
    name = "user_follow",
    uniqueConstraints =
        @UniqueConstraint(name = "uq_user_follow", columnNames = {"follower_id", "following_id"}))
public class UserFollow {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Getter
  private Long id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "follower_id", nullable = false)
  @Getter
  @Setter
  private User follower;

  @ManyToOne(optional = false)
  @JoinColumn(name = "following_id", nullable = false)
  @Getter
  @Setter
  private User following;

  @Column(name = "created_at", nullable = false, updatable = false)
  @Getter
  private Instant createdAt;

  protected UserFollow() {}

  public UserFollow(User follower, User following) {
    this.follower = follower;
    this.following = following;
  }

  @PrePersist
  void onCreate() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }
}
