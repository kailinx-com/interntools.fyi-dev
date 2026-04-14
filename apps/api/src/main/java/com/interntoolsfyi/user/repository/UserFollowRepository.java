package com.interntoolsfyi.user.repository;

import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.model.UserFollow;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserFollowRepository extends JpaRepository<UserFollow, Long> {

  Optional<UserFollow> findByFollowerAndFollowing(User follower, User following);

  boolean existsByFollowerAndFollowing(User follower, User following);

  List<UserFollow> findByFollowerOrderByCreatedAtDesc(User follower);

  List<UserFollow> findByFollowingOrderByCreatedAtDesc(User following);

  void deleteByFollowerAndFollowing(User follower, User following);

  @Query("SELECT COUNT(uf) FROM UserFollow uf WHERE uf.following = :user")
  long countFollowers(@Param("user") User user);

  @Query("SELECT COUNT(uf) FROM UserFollow uf WHERE uf.follower = :user")
  long countFollowing(@Param("user") User user);
}
