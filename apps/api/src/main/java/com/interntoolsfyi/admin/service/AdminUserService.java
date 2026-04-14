package com.interntoolsfyi.admin.service;

import com.interntoolsfyi.admin.dto.AdminUserResponse;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminUserService {

  private static final Set<String> ALLOWED_SORT_PROPERTIES =
      Set.of("id", "username", "email", "firstName", "lastName", "role");

  private final UserRepository userRepository;

  public AdminUserService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public Page<AdminUserResponse> listUsers(Pageable pageable, String search) {
    Pageable safe = sanitizePageable(pageable);
    String term = search == null ? "" : search.trim();
    if (term.isEmpty()) {
      return userRepository.findAll(safe).map(this::toResponse);
    }
    String safeTerm = term.replace("%", "").replace("_", "").trim();
    if (safeTerm.isEmpty()) {
      return userRepository.findAll(safe).map(this::toResponse);
    }
    Specification<User> spec = searchSpecification(safeTerm);
    return userRepository.findAll(spec, safe).map(this::toResponse);
  }

  private static Specification<User> searchSpecification(String term) {
    String pattern = "%" + term.toLowerCase() + "%";
    return (root, query, cb) -> {
      Predicate username = cb.like(cb.lower(root.get("username")), pattern);
      Predicate email = cb.like(cb.lower(root.get("email")), pattern);
      Predicate first = cb.like(cb.lower(root.get("firstName")), pattern);
      Predicate last = cb.like(cb.lower(root.get("lastName")), pattern);
      return cb.or(username, email, first, last);
    };
  }

  private static Pageable sanitizePageable(Pageable pageable) {
    Sort sort = pageable.getSort();
    if (sort.isEmpty()) {
      return PageRequest.of(
          pageable.getPageNumber(),
          pageable.getPageSize(),
          Sort.by(Sort.Direction.ASC, "username"));
    }
    List<Sort.Order> orders = new ArrayList<>();
    for (Sort.Order o : sort) {
      if (ALLOWED_SORT_PROPERTIES.contains(o.getProperty())) {
        orders.add(new Sort.Order(o.getDirection(), o.getProperty()));
      }
    }
    if (orders.isEmpty()) {
      return PageRequest.of(
          pageable.getPageNumber(),
          pageable.getPageSize(),
          Sort.by(Sort.Direction.ASC, "username"));
    }
    return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(orders));
  }

  @Transactional
  public AdminUserResponse updateUserRole(Long userId, Role newRole) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    if (user.getRole() == Role.ADMIN
        && newRole == Role.STUDENT
        && userRepository.countByRole(Role.ADMIN) <= 1) {
      throw new IllegalArgumentException("Cannot remove the last admin");
    }

    user.setRole(newRole);
    return toResponse(userRepository.save(user));
  }

  private AdminUserResponse toResponse(User user) {
    return new AdminUserResponse(
        user.getId(),
        user.getUsername(),
        user.getEmail(),
        user.getFirstName(),
        user.getLastName(),
        user.getRole());
  }
}
