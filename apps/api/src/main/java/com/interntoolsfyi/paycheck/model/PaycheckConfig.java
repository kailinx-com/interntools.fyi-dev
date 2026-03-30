package com.interntoolsfyi.paycheck.model;

import com.interntoolsfyi.user.model.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

/** Paycheck configurations for Paycheck Calculator. */
@Data
@Entity
public class PaycheckConfig {

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

  @Column(nullable = false)
  @Getter
  @Setter
  private LocalDate startDate;

  @Column(nullable = false)
  @Getter
  @Setter
  private LocalDate endDate;

  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  @Getter
  @Setter
  private State state;

  @Column(nullable = false)
  @Getter
  @Setter
  private Float hourlyRate;

  @Column(nullable = false)
  @Getter
  @Setter
  private Integer workHoursPerDay;

  @Column(nullable = false)
  @Getter
  @Setter
  private Integer workDaysPerWeek;

  @Getter @Setter private Float stipendPerWeek;

  @Column(nullable = false)
  @Getter
  @Setter
  private String residency;

  @Getter @Setter private String visaType;

  @Getter
  @Setter
  private Integer arrivalYear;

  @Column(nullable = false)
  @Getter
  @Setter
  private String ficaMode;

  @PrePersist
  void onCreate() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }
}
