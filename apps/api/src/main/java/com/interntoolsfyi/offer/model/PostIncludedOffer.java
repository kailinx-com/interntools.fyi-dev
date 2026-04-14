package com.interntoolsfyi.offer.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(
    name = "post_included_offer",
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uq_post_included_offer_post_sort",
          columnNames = {"post_id", "sort_order"}),
      @UniqueConstraint(
          name = "uq_post_included_offer_post_offer",
          columnNames = {"post_id", "offer_id"})
    })
public class PostIncludedOffer {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "post_id", nullable = false)
  private Post post;

  @ManyToOne(optional = false)
  @JoinColumn(name = "offer_id", nullable = false)
  private Offer offer;

  @Column(name = "sort_order", nullable = false)
  private int sortOrder;
}
