package com.interntoolsfyi.offer.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.interntoolsfyi.offer.model.CompensationType;
import com.interntoolsfyi.offer.model.EmploymentType;
import com.interntoolsfyi.offer.model.Offer;
import com.interntoolsfyi.offer.model.Post;
import com.interntoolsfyi.offer.model.PostIncludedOffer;
import com.interntoolsfyi.offer.model.PostStatus;
import com.interntoolsfyi.offer.model.PostType;
import com.interntoolsfyi.offer.model.PostVisibility;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class PostRepositoryTest {
  @Autowired private PostRepository postRepository;
  @Autowired private OfferRepository offerRepository;
  @Autowired private UserRepository userRepository;

  @Test
  @DisplayName("findByStatusOrderByPublishedAtDesc returns published posts ordered by publishedAt")
  void findByStatusReturnsPublishedOrdered() {
    User author = userRepository.saveAndFlush(createUser("author4", "author4@example.com"));
    Post older = postRepository.saveAndFlush(createPost(author, "Older", PostStatus.published, Instant.parse("2026-01-01T00:00:00Z")));
    Post newer = postRepository.saveAndFlush(createPost(author, "Newer", PostStatus.published, Instant.parse("2026-02-01T00:00:00Z")));
    postRepository.saveAndFlush(createPost(author, "Draft", PostStatus.draft, null));

    List<Post> result =
        postRepository
            .findByStatusOrderByPublishedAtDesc(PostStatus.published, PageRequest.of(0, 10))
            .getContent();

    assertThat(result).extracting(Post::getId).containsExactly(newer.getId(), older.getId());
  }

  @Test
  @DisplayName(
      "findPublishedPublicMatchingText matches title, body, acceptance office, and linked offer fields")
  void findPublishedPublicMatchingText_matchesTitleBodyAcceptanceOfficeAndOfferFields() {
    User author = userRepository.saveAndFlush(createUser("matchAuthor", "matchAuthor@example.com"));
    Instant published = Instant.parse("2026-03-10T12:00:00Z");

    Offer denverOffer = offerRepository.saveAndFlush(buildOffer(author, "SearchCoDenver", "Denver"));
    Offer austinOffer = offerRepository.saveAndFlush(buildOffer(author, "SearchCoAustin", "Austin"));

    Post byTitle = savePublishedPost(author, "UniqueTitleTokenAlpha", null, PostType.acceptance, published);
    attachOffer(byTitle, denverOffer, 0);
    postRepository.saveAndFlush(byTitle);

    Post byBody =
        savePublishedPost(author, "T", "Paragraph with UniqueBodyTokenBeta text", PostType.acceptance, published);
    attachOffer(byBody, denverOffer, 0);
    postRepository.saveAndFlush(byBody);

    Post acceptancePortland =
        savePublishedPost(author, "No token in title", null, PostType.acceptance, published);
    acceptancePortland.setOfficeLocation("Portland");
    attachOffer(acceptancePortland, denverOffer, 0);
    postRepository.saveAndFlush(acceptancePortland);

    Post comparisonStaleOffice =
        savePublishedPost(author, "Comparison quiet", "no tokens", PostType.comparison, published);
    comparisonStaleOffice.setOfficeLocation("Wrongville");
    attachOffer(comparisonStaleOffice, austinOffer, 0);
    postRepository.saveAndFlush(comparisonStaleOffice);

    assertThat(idsMatching("UniqueTitleTokenAlpha")).contains(byTitle.getId());
    assertThat(idsMatching("UniqueBodyTokenBeta")).contains(byBody.getId());
    assertThat(idsMatching("Portland")).contains(acceptancePortland.getId());
    assertThat(idsMatching("Denver")).contains(acceptancePortland.getId());
    assertThat(idsMatching("SearchCoDenver")).contains(acceptancePortland.getId());

    assertThat(idsMatching("Wrongville")).doesNotContain(comparisonStaleOffice.getId());
    assertThat(idsMatching("Austin")).contains(comparisonStaleOffice.getId());
  }

  private List<Long> idsMatching(String text) {
    return postRepository
        .findPublishedPublicMatchingText(
            PostStatus.published, PostVisibility.public_post, text, PageRequest.of(0, 20))
        .stream()
        .map(Post::getId)
        .toList();
  }

  private Post savePublishedPost(
      User author, String title, String body, PostType type, Instant publishedAt) {
    Post post = new Post();
    post.setAuthor(author);
    post.setType(type);
    post.setTitle(title);
    post.setBody(body);
    post.setVisibility(PostVisibility.public_post);
    post.setStatus(PostStatus.published);
    post.setPublishedAt(publishedAt);
    return post;
  }

  private static void attachOffer(Post post, Offer offer, int sortOrder) {
    PostIncludedOffer link = new PostIncludedOffer();
    link.setPost(post);
    link.setOffer(offer);
    link.setSortOrder(sortOrder);
    post.getIncludedOffers().add(link);
  }

  private static Offer buildOffer(User user, String company, String officeLocation) {
    Offer offer = new Offer();
    offer.setUser(user);
    offer.setCompany(company);
    offer.setTitle("Engineer");
    offer.setEmploymentType(EmploymentType.internship);
    offer.setCompensationType(CompensationType.hourly);
    offer.setPayAmount(40f);
    offer.setOfficeLocation(officeLocation);
    return offer;
  }

  private static User createUser(String username, String email) {
    return new User(username, email, "hashed-password", Role.STUDENT, "Test", "User");
  }

  private static Post createPost(User author, String title, PostStatus status, Instant publishedAt) {
    Post post = new Post();
    post.setAuthor(author);
    post.setType(PostType.acceptance);
    post.setTitle(title);
    post.setVisibility(PostVisibility.public_post);
    post.setStatus(status);
    post.setPublishedAt(publishedAt);
    return post;
  }
}
