package com.interntoolsfyi.offer.model;

import com.interntoolsfyi.user.model.User;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.Data;

@Data
@Entity
public class Comment {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne
  @JoinColumn(name = "post_id", nullable = false)
  private Post post;

  @ManyToOne
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne
  @JoinColumn(name = "parent_id")
  private Comment parent;

  @Lob
  @Column(nullable = false)
  private String body;

  @Column(name = "edited_at")
  private Instant editedAt;

  @Column(nullable = false)
  private Boolean deleted = false;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void onCreate() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }
}
