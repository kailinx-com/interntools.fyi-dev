package com.interntoolsfyi.offer.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.interntoolsfyi.offer.model.CommunityPreferenceVote;
import com.interntoolsfyi.offer.model.Post;
import com.interntoolsfyi.offer.testsupport.PostFixtures;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class CommunityPreferenceVoteRepositoryTest {
  @Autowired private CommunityPreferenceVoteRepository voteRepository;
  @Autowired private PostRepository postRepository;
  @Autowired private OfferRepository offerRepository;
  @Autowired private UserRepository userRepository;

  @Test
  @DisplayName("findByPostAndUser and countByPostAndSelectedOfferSnapshotId work together")
  void findAndCountWork() {
    User author = userRepository.saveAndFlush(createUser("author3", "author3@example.com"));
    User voter1 = userRepository.saveAndFlush(createUser("v1", "v1@example.com"));
    User voter2 = userRepository.saveAndFlush(createUser("v2", "v2@example.com"));
    Post post = PostFixtures.savePublishedPost(author, "Vote post", offerRepository, postRepository);

    voteRepository.saveAndFlush(createVote(post, voter1, "snap-a"));
    voteRepository.saveAndFlush(createVote(post, voter2, "snap-a"));

    assertThat(voteRepository.findByPostAndUser(post, voter1)).isPresent();
    assertThat(voteRepository.countByPostAndSelectedOfferSnapshotId(post, "snap-a")).isEqualTo(2);
    assertThat(voteRepository.findByPost(post)).hasSize(2);
  }

  private static User createUser(String username, String email) {
    return new User(username, email, "hashed-password", Role.STUDENT, "Test", "User");
  }

  private static CommunityPreferenceVote createVote(Post post, User user, String snapshotId) {
    CommunityPreferenceVote vote = new CommunityPreferenceVote();
    vote.setPost(post);
    vote.setUser(user);
    vote.setSelectedOfferSnapshotId(snapshotId);
    return vote;
  }
}
