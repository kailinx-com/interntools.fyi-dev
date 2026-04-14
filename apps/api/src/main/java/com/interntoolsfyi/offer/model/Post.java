package com.interntoolsfyi.offer.model;

import com.interntoolsfyi.user.model.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
@Entity
@Table(
    name = "post",
    indexes = @Index(name = "idx_post_published_at", columnList = "published_at DESC"))
public class Post {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne
  @JoinColumn(name = "author_user_id", nullable = false)
  private User author;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private PostType type;

  private String title;

  @Lob
  private String body;

  @Column(name = "office_location")
  private String officeLocation;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private PostVisibility visibility = PostVisibility.public_post;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private PostStatus status = PostStatus.draft;

  @ManyToOne
  @JoinColumn(name = "comparison_id")
  private Comparison comparison;

  @OneToMany(
      mappedBy = "post",
      cascade = CascadeType.ALL,
      orphanRemoval = true,
      fetch = FetchType.LAZY)
  @OrderBy("sortOrder ASC")
  private List<PostIncludedOffer> includedOffers = new ArrayList<>();

  @Column(name = "published_at")
  private Instant publishedAt;

  @Column(name = "updated_at")
  private Instant updatedAt;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void onCreate() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = Instant.now();
  }
}
