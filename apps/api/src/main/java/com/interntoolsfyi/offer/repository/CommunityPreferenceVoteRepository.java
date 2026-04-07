package com.interntoolsfyi.offer.repository;

import com.interntoolsfyi.offer.model.CommunityPreferenceVote;
import com.interntoolsfyi.offer.model.Post;
import com.interntoolsfyi.user.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityPreferenceVoteRepository
    extends JpaRepository<CommunityPreferenceVote, Long> {
  List<CommunityPreferenceVote> findByPost(Post post);

  Optional<CommunityPreferenceVote> findByPostAndUser(Post post, User user);

  long countByPostAndSelectedOfferSnapshotId(Post post, String snapshotId);
}
