package com.interntoolsfyi.offer.repository;

import com.interntoolsfyi.offer.model.Comment;
import com.interntoolsfyi.offer.model.Post;
import com.interntoolsfyi.user.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {
  List<Comment> findByPostAndDeletedFalseOrderByCreatedAtAsc(Post post);

  Optional<Comment> findByIdAndUser(Long id, User user);
}
