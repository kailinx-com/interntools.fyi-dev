package com.interntoolsfyi.offer.repository;

import com.interntoolsfyi.offer.model.Post;
import com.interntoolsfyi.offer.model.SavedPost;
import com.interntoolsfyi.user.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedPostRepository extends JpaRepository<SavedPost, Long> {
  Optional<SavedPost> findByPostAndUser(Post post, User user);
  boolean existsByPostAndUser(Post post, User user);
  List<SavedPost> findByUserOrderByCreatedAtDesc(User user);
  void deleteByPostAndUser(Post post, User user);
}
