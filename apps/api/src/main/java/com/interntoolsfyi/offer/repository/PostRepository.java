package com.interntoolsfyi.offer.repository;

import com.interntoolsfyi.offer.model.Post;
import com.interntoolsfyi.offer.model.PostStatus;
import com.interntoolsfyi.user.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {
  Page<Post> findByStatusOrderByPublishedAtDesc(PostStatus status, Pageable pageable);

  List<Post> findByAuthorOrderByCreatedAtDesc(User author);

  Optional<Post> findByIdAndAuthor(Long id, User author);
}
