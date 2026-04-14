package com.interntoolsfyi.offer.service;

import com.interntoolsfyi.offer.dto.OfferResponse;
import com.interntoolsfyi.offer.dto.PostDetailResponse;
import com.interntoolsfyi.offer.dto.PostOfferItemRequest;
import com.interntoolsfyi.offer.dto.PostRequest;
import com.interntoolsfyi.offer.dto.PostSummaryResponse;
import com.interntoolsfyi.offer.dto.ResolvePlaceLinksRequest;
import com.interntoolsfyi.offer.dto.ResolvePlaceLinksResponse;
import com.interntoolsfyi.offer.model.Comparison;
import com.interntoolsfyi.offer.model.Offer;
import com.interntoolsfyi.offer.model.Post;
import com.interntoolsfyi.offer.model.PostIncludedOffer;
import com.interntoolsfyi.offer.model.PostStatus;
import com.interntoolsfyi.offer.model.PostType;
import com.interntoolsfyi.offer.model.PostVisibility;
import com.interntoolsfyi.offer.repository.ComparisonRepository;
import com.interntoolsfyi.offer.repository.OfferRepository;
import com.interntoolsfyi.offer.repository.PostRepository;
import com.interntoolsfyi.offer.repository.SavedPostRepository;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PostService {

  private final PostRepository postRepository;
  private final SavedPostRepository savedPostRepository;
  private final UserRepository userRepository;
  private final OfferRepository offerRepository;
  private final ComparisonRepository comparisonRepository;
  private final OfferService offerService;

  @PersistenceContext private EntityManager entityManager;

  public PostService(
      PostRepository postRepository,
      SavedPostRepository savedPostRepository,
      UserRepository userRepository,
      OfferRepository offerRepository,
      ComparisonRepository comparisonRepository,
      OfferService offerService) {
    this.postRepository = postRepository;
    this.savedPostRepository = savedPostRepository;
    this.userRepository = userRepository;
    this.offerRepository = offerRepository;
    this.comparisonRepository = comparisonRepository;
    this.offerService = offerService;
  }

  @Transactional(readOnly = true)
  public Page<PostSummaryResponse> listPublishedPosts(Authentication auth, Pageable pageable) {
    return postRepository
        .findByStatusOrderByPublishedAtDesc(PostStatus.published, pageable)
        .map(p -> toSummary(p, auth));
  }

  @Transactional(readOnly = true)
  public List<PostSummaryResponse> listPublishedPostsByUser(Long userId, Authentication auth) {
    User author =
        userRepository
            .findById(userId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    return postRepository
        .findByAuthorAndStatusAndVisibilityOrderByPublishedAtDesc(
            author, PostStatus.published, PostVisibility.public_post)
        .stream()
        .map(p -> toSummary(p, auth))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<PostSummaryResponse> listMyPosts(Authentication auth) {
    User user = requireUser(auth);
    return postRepository.findByAuthorOrderByCreatedAtDesc(user).stream()
        .filter(p -> p.getStatus() != PostStatus.hidden)
        .map(p -> toSummary(p, auth))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<PostSummaryResponse> listPublishedMatchingLocation(
      Authentication auth, String text, Pageable pageable) {
    if (text == null || text.isBlank()) {
      return List.of();
    }
    String trimmed = text.trim();
    if (trimmed.length() < 2) {
      return List.of();
    }
    Pageable limited =
        pageable == null
            ? PageRequest.of(0, 20)
            : PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), 50));
    return postRepository
        .findPublishedPublicMatchingLocation(
            PostStatus.published, PostVisibility.public_post, trimmed, limited)
        .stream()
        .map(p -> toSummary(p, auth))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<PostSummaryResponse> listPublishedMatchingLocationTokens(
      Authentication auth, List<String> rawTokens, Pageable pageable) {
    List<String> tokens = sanitizeLocationTokens(rawTokens);
    if (tokens.isEmpty()) {
      return List.of();
    }
    final int maxTotal =
        pageable == null ? 50 : Math.min(Math.max(pageable.getPageSize(), 1), 50);
    Pageable perTokenPage = PageRequest.of(0, maxTotal);
    LinkedHashMap<Long, Post> byId = new LinkedHashMap<>();
    for (String token : tokens) {
      List<Post> found =
          postRepository.findPublishedPublicMatchingLocation(
              PostStatus.published, PostVisibility.public_post, token, perTokenPage);
      for (Post p : found) {
        byId.putIfAbsent(p.getId(), p);
      }
    }
    return byId.values().stream()
        .sorted(
            Comparator.comparing(
                    Post::getPublishedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                .reversed())
        .limit(maxTotal)
        .map(p -> toSummary(p, auth))
        .toList();
  }

  private static List<String> sanitizeLocationTokens(List<String> raw) {
    if (raw == null) {
      return List.of();
    }
    return raw.stream()
        .map(String::trim)
        .map(t -> t.replace("%", "").replace("_", ""))
        .filter(t -> t.length() >= 2)
        .distinct()
        .limit(20)
        .toList();
  }

  @Transactional(readOnly = true)
  public ResolvePlaceLinksResponse resolvePlaceLinks(ResolvePlaceLinksRequest request) {
    List<Long> offerIds = request.offerIds().stream().distinct().limit(100).toList();
    List<Long> comparisonIds = request.comparisonIds().stream().distinct().limit(100).toList();

    Map<Long, Long> byOffer = new HashMap<>();
    if (!offerIds.isEmpty()) {
      List<Post> posts =
          postRepository.findPublishedPostsIncludingAnyOfferId(
              offerIds, PostStatus.published, PostVisibility.public_post);
      for (Long oid : offerIds) {
        posts.stream()
            .filter(
                p ->
                    p.getIncludedOffers().stream()
                        .anyMatch(
                            pio -> pio.getOffer() != null && oid.equals(pio.getOffer().getId())))
            .max(
                Comparator.comparing(
                    Post::getPublishedAt, Comparator.nullsLast(Comparator.naturalOrder())))
            .ifPresent(p -> byOffer.put(oid, p.getId()));
      }
    }

    Map<Long, Long> byComparison = new HashMap<>();
    if (!comparisonIds.isEmpty()) {
      List<Post> compPosts =
          postRepository.findPublishedPostsForComparisonIds(
              comparisonIds, PostStatus.published, PostVisibility.public_post);
      Map<Long, List<Post>> grouped =
          compPosts.stream()
              .filter(p -> p.getComparison() != null)
              .collect(Collectors.groupingBy(p -> p.getComparison().getId()));
      for (Long cid : comparisonIds) {
        List<Post> list = grouped.get(cid);
        if (list == null || list.isEmpty()) {
          continue;
        }
        list.stream()
            .max(
                Comparator.comparing(
                    Post::getPublishedAt, Comparator.nullsLast(Comparator.naturalOrder())))
            .ifPresent(p -> byComparison.put(cid, p.getId()));
      }
    }

    return new ResolvePlaceLinksResponse(Map.copyOf(byOffer), Map.copyOf(byComparison));
  }

  @Transactional(readOnly = true)
  public PostDetailResponse getPost(Authentication auth, Long id) {
    Post post =
        postRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));

    if (post.getVisibility() != PostVisibility.public_post
        || post.getStatus() != PostStatus.published) {
      User user = requireUser(auth);
      if (!post.getAuthor().getId().equals(user.getId())) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found");
      }
    }

    return toDetail(post, auth);
  }

  @Transactional
  public PostDetailResponse createPost(Authentication auth, PostRequest request) {
    User user = requireUser(auth);
    Post post = new Post();
    post.setAuthor(user);
    applyRequest(post, request, user);
    if (post.getStatus() == PostStatus.published) {
      post.setPublishedAt(Instant.now());
    }
    return toDetail(postRepository.save(post), auth);
  }

  @Transactional
  public PostDetailResponse updatePost(Authentication auth, Long id, PostRequest request) {
    User user = requireUser(auth);
    Post post = requireAuthor(id, user);
    applyRequest(post, request, user);
    if (post.getStatus() == PostStatus.published && post.getPublishedAt() == null) {
      post.setPublishedAt(Instant.now());
    }
    return toDetail(postRepository.save(post), auth);
  }

  @Transactional
  public void deletePost(Authentication auth, Long id) {
    User user = requireUser(auth);
    Post post = requireAuthor(id, user);
    savedPostRepository.deleteAllByPost(post);
    post.setStatus(PostStatus.hidden);
    postRepository.save(post);
  }

  private void applyRequest(Post post, PostRequest req, User author) {
    post.setType(req.type());
    post.setTitle(req.title());
    post.setBody(req.body());
    if (req.type() == PostType.comparison) {
      post.setOfficeLocation(null);
    } else {
      String loc = req.officeLocation();
      post.setOfficeLocation(loc != null && !loc.isBlank() ? loc.trim() : null);
    }
    post.setVisibility(req.visibility() != null ? req.visibility() : PostVisibility.public_post);
    post.setStatus(req.status());
    replaceIncludedOffers(post, req, author);
  }

  private void replaceIncludedOffers(Post post, PostRequest req, User author) {
    post.getIncludedOffers().clear();
    post.setComparison(null);
    if (post.getId() != null) {
      entityManager.flush();
    }

    if (req.comparisonId() != null) {
      Comparison c =
          comparisonRepository
              .findByIdAndUser(req.comparisonId(), author)
              .orElseThrow(
                  () ->
                      new ResponseStatusException(
                          HttpStatus.BAD_REQUEST, "Comparison not found or not owned"));
      List<Long> ids = c.getIncludedOfferIds();
      if (ids == null || ids.isEmpty()) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "Comparison has no linked offers");
      }
      post.setComparison(c);
      int order = 0;
      for (Long oid : ids) {
        Offer o =
            offerRepository
                .findByIdAndUser(oid, author)
                .orElseThrow(
                    () ->
                        new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Offer not found or not owned: " + oid));
        PostIncludedOffer link = new PostIncludedOffer();
        link.setPost(post);
        link.setOffer(o);
        link.setSortOrder(order++);
        post.getIncludedOffers().add(link);
      }
      return;
    }

    List<PostOfferItemRequest> items = req.offers() != null ? req.offers() : List.of();
    if (items.isEmpty()) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "offers is required when comparisonId is omitted");
    }

    int order = 0;
    for (PostOfferItemRequest item : items) {
      Offer o = resolveOfferForItem(item, author);
      PostIncludedOffer link = new PostIncludedOffer();
      link.setPost(post);
      link.setOffer(o);
      link.setSortOrder(order++);
      post.getIncludedOffers().add(link);
    }
  }

  private Offer resolveOfferForItem(PostOfferItemRequest item, User author) {
    if (item.offerId() != null) {
      return offerRepository
          .findByIdAndUser(item.offerId(), author)
          .orElseThrow(
              () ->
                  new ResponseStatusException(
                      HttpStatus.BAD_REQUEST, "Offer not found or not owned: " + item.offerId()));
    }
    try {
      Offer created = PostInlineOfferFactory.createInlineOffer(author, item);
      return offerRepository.save(created);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
    }
  }

  private Post requireAuthor(Long id, User user) {
    return postRepository
        .findByIdAndAuthor(id, user)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
  }

  private User requireUser(Authentication auth) {
    if (auth == null || !auth.isAuthenticated()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }
    return userRepository
        .findByUsername(auth.getName())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
  }

  private boolean isBookmarked(Post p, Authentication auth) {
    if (auth == null || !auth.isAuthenticated()) return false;
    return userRepository.findByUsername(auth.getName())
        .map(u -> savedPostRepository.existsByPostAndUser(p, u))
        .orElse(false);
  }

  private PostSummaryResponse toSummary(Post p, Authentication auth) {
    return new PostSummaryResponse(
        p.getId(),
        p.getType(),
        p.getTitle(),
        p.getOfficeLocation(),
        p.getVisibility(),
        p.getStatus(),
        p.getAuthor().getUsername(),
        p.getPublishedAt(),
        p.getCreatedAt(),
        isBookmarked(p, auth));
  }

  private PostDetailResponse toDetail(Post p, Authentication auth) {
    List<OfferResponse> offers =
        p.getIncludedOffers().stream()
            .sorted(Comparator.comparingInt(PostIncludedOffer::getSortOrder))
            .map(PostIncludedOffer::getOffer)
            .filter(Objects::nonNull)
            .map(offerService::toOfferResponse)
            .toList();

    Long comparisonId = p.getComparison() != null ? p.getComparison().getId() : null;

    return new PostDetailResponse(
        p.getId(),
        p.getType(),
        p.getTitle(),
        p.getBody(),
        p.getOfficeLocation(),
        p.getVisibility(),
        p.getStatus(),
        p.getAuthor().getUsername(),
        comparisonId,
        offers,
        p.getPublishedAt(),
        p.getCreatedAt(),
        p.getUpdatedAt(),
        isBookmarked(p, auth));
  }
}
