package com.interntoolsfyi.paycheck.model;

import com.interntoolsfyi.user.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "paycheck_saved_plans")
public class PaycheckSavedPlan {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Getter
  private Long id;

  @Column(nullable = false)
  @Getter
  @Setter
  private String name;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  @Getter
  @Setter
  private User user;

  @Column(name = "created_at", nullable = false, updatable = false)
  @Getter
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  @Getter
  private Instant updatedAt;

  @Lob
  @Column(name = "config_json", nullable = false)
  @Getter
  @Setter
  private String configJson;

  @Lob
  @Column(name = "planner_data_json", nullable = false)
  @Getter
  @Setter
  private String plannerDataJson;

  @PrePersist
  void onCreate() {
    Instant now = Instant.now();
    if (createdAt == null) {
      createdAt = now;
    }
    if (updatedAt == null) {
      updatedAt = now;
    }
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = Instant.now();
  }
}
