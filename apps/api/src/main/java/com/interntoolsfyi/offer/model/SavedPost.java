package com.interntoolsfyi.offer.model;

import com.interntoolsfyi.user.model.User;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.Data;

@Data
@Entity
@Table(
    name = "saved_post",
    uniqueConstraints =
        @UniqueConstraint(
            name = "uq_saved_post_user",
            columnNames = {"post_id", "user_id"}))
public class SavedPost {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne
  @JoinColumn(name = "post_id", nullable = false)
  private Post post;

  @ManyToOne
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void onCreate() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }
}
