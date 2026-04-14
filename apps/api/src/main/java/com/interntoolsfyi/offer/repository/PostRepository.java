package com.interntoolsfyi.offer.repository;

import com.interntoolsfyi.offer.model.Post;
import com.interntoolsfyi.offer.model.PostStatus;
import com.interntoolsfyi.offer.model.PostVisibility;
import com.interntoolsfyi.user.model.User;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {
  Page<Post> findByStatusOrderByPublishedAtDesc(PostStatus status, Pageable pageable);

  List<Post> findByAuthorOrderByCreatedAtDesc(User author);

  List<Post> findByAuthorAndStatusAndVisibilityOrderByPublishedAtDesc(
      User author, PostStatus status, PostVisibility visibility);

  Optional<Post> findByIdAndAuthor(Long id, User author);

  @Query(
      """
      SELECT DISTINCT p FROM Post p
      LEFT JOIN p.includedOffers pio
      LEFT JOIN pio.offer o
      WHERE p.status = :status
      AND p.visibility = :visibility
      AND (
        LOWER(COALESCE(p.title, '')) LIKE LOWER(CONCAT('%', :text, '%'))
        OR LOWER(COALESCE(CAST(p.body AS string), '')) LIKE LOWER(CONCAT('%', :text, '%'))
        OR (
          p.type = com.interntoolsfyi.offer.model.PostType.acceptance
          AND LOWER(COALESCE(p.officeLocation, '')) LIKE LOWER(CONCAT('%', :text, '%'))
        )
        OR (
          o IS NOT NULL AND (
            LOWER(COALESCE(o.company, '')) LIKE LOWER(CONCAT('%', :text, '%'))
            OR LOWER(COALESCE(o.title, '')) LIKE LOWER(CONCAT('%', :text, '%'))
            OR LOWER(COALESCE(o.officeLocation, '')) LIKE LOWER(CONCAT('%', :text, '%'))
            OR LOWER(COALESCE(o.equityNotes, '')) LIKE LOWER(CONCAT('%', :text, '%'))
            OR LOWER(COALESCE(CAST(o.notes AS string), '')) LIKE LOWER(CONCAT('%', :text, '%'))
          )
        )
      )
      ORDER BY p.publishedAt DESC
      """)
  List<Post> findPublishedPublicMatchingText(
      @Param("status") PostStatus status,
      @Param("visibility") PostVisibility visibility,
      @Param("text") String text,
      Pageable pageable);

  /**
   * Location-only variant used by the /posts/related-location endpoint.
   * Only matches against officeLocation fields (post's own and linked offers').
   * Does NOT search title, body, company, notes etc. to avoid false positives
   * from short location tokens like state/country names.
   */
  @Query(
      """
      SELECT DISTINCT p FROM Post p
      LEFT JOIN p.includedOffers pio
      LEFT JOIN pio.offer o
      WHERE p.status = :status
      AND p.visibility = :visibility
      AND (
        LOWER(COALESCE(p.officeLocation, '')) LIKE LOWER(CONCAT('%', :text, '%'))
        OR (
          o IS NOT NULL AND
          LOWER(COALESCE(o.officeLocation, '')) LIKE LOWER(CONCAT('%', :text, '%'))
        )
      )
      ORDER BY p.publishedAt DESC
      """)
  List<Post> findPublishedPublicMatchingLocation(
      @Param("status") PostStatus status,
      @Param("visibility") PostVisibility visibility,
      @Param("text") String text,
      Pageable pageable);

  @Query(
      """
      SELECT DISTINCT p FROM Post p
      JOIN FETCH p.includedOffers pio
      JOIN FETCH pio.offer o
      WHERE o.id IN :offerIds
      AND p.status = :status
      AND p.visibility = :visibility
      """)
  List<Post> findPublishedPostsIncludingAnyOfferId(
      @Param("offerIds") Collection<Long> offerIds,
      @Param("status") PostStatus status,
      @Param("visibility") PostVisibility visibility);

  @Query(
      """
      SELECT p FROM Post p
      WHERE p.comparison.id IN :comparisonIds
      AND p.status = :status
      AND p.visibility = :visibility
      """)
  List<Post> findPublishedPostsForComparisonIds(
      @Param("comparisonIds") Collection<Long> comparisonIds,
      @Param("status") PostStatus status,
      @Param("visibility") PostVisibility visibility);
}
