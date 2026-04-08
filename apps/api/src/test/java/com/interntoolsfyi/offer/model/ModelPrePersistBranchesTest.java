package com.interntoolsfyi.offer.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Covers both branches of {@code if (createdAt == null)} in entity {@code @PrePersist} hooks. */
class ModelPrePersistBranchesTest {

  @Test
  @DisplayName("Comment.onCreate sets createdAt when null")
  void commentSetsCreatedAtWhenNull() {
    Comment c = new Comment();
    c.onCreate();
    assertThat(c.getCreatedAt()).isNotNull();
  }

  @Test
  @DisplayName("Comment.onCreate preserves preset createdAt")
  void commentPreservesCreatedAt() {
    Comment c = new Comment();
    Instant past = Instant.parse("2020-01-01T00:00:00Z");
    c.setCreatedAt(past);
    c.onCreate();
    assertThat(c.getCreatedAt()).isEqualTo(past);
  }

  @Test
  @DisplayName("SavedPost.onCreate preserves preset createdAt")
  void savedPostPreservesCreatedAt() {
    SavedPost sp = new SavedPost();
    Instant past = Instant.parse("2020-01-01T00:00:00Z");
    sp.setCreatedAt(past);
    sp.onCreate();
    assertThat(sp.getCreatedAt()).isEqualTo(past);
  }

  @Test
  @DisplayName("CommunityPreferenceVote.onCreate preserves preset createdAt")
  void votePreservesCreatedAt() {
    CommunityPreferenceVote v = new CommunityPreferenceVote();
    Instant past = Instant.parse("2020-01-01T00:00:00Z");
    v.setCreatedAt(past);
    v.onCreate();
    assertThat(v.getCreatedAt()).isEqualTo(past);
  }

  @Test
  @DisplayName("Post.onCreate preserves preset createdAt")
  void postPreservesCreatedAt() {
    Post p = new Post();
    Instant past = Instant.parse("2020-01-01T00:00:00Z");
    p.setCreatedAt(past);
    p.onCreate();
    assertThat(p.getCreatedAt()).isEqualTo(past);
  }

  @Test
  @DisplayName("Post.onUpdate sets updatedAt")
  void postOnUpdateSetsUpdatedAt() {
    Post p = new Post();
    p.onUpdate();
    assertThat(p.getUpdatedAt()).isNotNull();
  }

  @Test
  @DisplayName("Offer.onCreate sets timestamps when null")
  void offerSetsTimestampsWhenNull() {
    Offer o = new Offer();
    o.onCreate();
    assertThat(o.getCreatedAt()).isNotNull();
    assertThat(o.getUpdatedAt()).isNotNull();
  }

  @Test
  @DisplayName("Offer.onCreate preserves createdAt when preset")
  void offerPreservesCreatedAt() {
    Offer o = new Offer();
    Instant past = Instant.parse("2020-01-01T00:00:00Z");
    o.setCreatedAt(past);
    o.onCreate();
    assertThat(o.getCreatedAt()).isEqualTo(past);
  }

  @Test
  @DisplayName("Offer.onUpdate sets updatedAt")
  void offerOnUpdateSetsUpdatedAt() {
    Offer o = new Offer();
    o.onUpdate();
    assertThat(o.getUpdatedAt()).isNotNull();
  }
}
