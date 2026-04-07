package com.interntoolsfyi.offer.model;

import com.interntoolsfyi.user.model.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.List;
import lombok.Data;

@Data
@Entity
public class Comparison {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  private String name;

  @ElementCollection
  @OrderColumn(name = "included_offer_ids_order")
  private List<Long> includedOfferIds;

  private String description;

  @Lob
  private String computedMetrics;

  private Boolean isPublished;

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
}
