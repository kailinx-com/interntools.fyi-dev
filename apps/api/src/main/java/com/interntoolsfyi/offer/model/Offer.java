package com.interntoolsfyi.offer.model;

import com.interntoolsfyi.user.model.User;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.Data;

@Data
@Entity
public class Offer {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  private String company;
  private String title;

  @Enumerated(EnumType.STRING)
  @Column(columnDefinition = "varchar(50)")
  private EmploymentType employmentType;

  @Enumerated(EnumType.STRING)
  @Column(columnDefinition = "varchar(50)")
  private CompensationType compensationType;

  private Float payAmount;
  private Integer hoursPerWeek;
  private Float signOnBonus;
  private Float relocationAmount;
  private String equityNotes;
  private String officeLocation;
  private Integer daysInOffice;
  private String notes;
  private Boolean favorite;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void onCreate() {
    var now = Instant.now();
    if (createdAt == null) createdAt = now;
    if (updatedAt == null) updatedAt = now;
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = Instant.now();
  }
}
