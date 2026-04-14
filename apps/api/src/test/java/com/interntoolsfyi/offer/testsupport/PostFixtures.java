package com.interntoolsfyi.offer.testsupport;

import com.interntoolsfyi.offer.model.Offer;
import com.interntoolsfyi.offer.model.Post;
import com.interntoolsfyi.offer.model.PostIncludedOffer;
import com.interntoolsfyi.offer.model.PostStatus;
import com.interntoolsfyi.offer.model.PostType;
import com.interntoolsfyi.offer.model.PostVisibility;
import com.interntoolsfyi.offer.repository.OfferRepository;
import com.interntoolsfyi.offer.repository.PostRepository;
import com.interntoolsfyi.user.model.User;
import java.time.Instant;

public final class PostFixtures {

  private PostFixtures() {}

  public static Offer minimalOffer(User author) {
    Offer o = new Offer();
    o.setUser(author);
    o.setCompany("Acme");
    o.setTitle("Engineer");
    return o;
  }

  public static void attachOffer(Post post, Offer offer, int sortOrder) {
    PostIncludedOffer link = new PostIncludedOffer();
    link.setPost(post);
    link.setOffer(offer);
    link.setSortOrder(sortOrder);
    post.getIncludedOffers().add(link);
  }

  public static Post savePublishedPost(
      User author, String title, OfferRepository offerRepository, PostRepository postRepository) {
    Offer o = offerRepository.saveAndFlush(minimalOffer(author));
    Post post = new Post();
    post.setAuthor(author);
    post.setTitle(title);
    post.setType(PostType.acceptance);
    post.setStatus(PostStatus.published);
    post.setVisibility(PostVisibility.public_post);
    post.setPublishedAt(Instant.now());
    attachOffer(post, o, 0);
    return postRepository.saveAndFlush(post);
  }

  public static Post saveDraftPost(
      User author, String title, OfferRepository offerRepository, PostRepository postRepository) {
    Offer o = offerRepository.saveAndFlush(minimalOffer(author));
    Post post = new Post();
    post.setAuthor(author);
    post.setTitle(title);
    post.setType(PostType.acceptance);
    post.setStatus(PostStatus.draft);
    post.setVisibility(PostVisibility.public_post);
    attachOffer(post, o, 0);
    return postRepository.saveAndFlush(post);
  }

  public static Post savePost(
      User author,
      String title,
      PostStatus status,
      PostVisibility visibility,
      OfferRepository offerRepository,
      PostRepository postRepository) {
    Offer o = offerRepository.saveAndFlush(minimalOffer(author));
    Post post = new Post();
    post.setAuthor(author);
    post.setTitle(title);
    post.setType(PostType.acceptance);
    post.setStatus(status);
    post.setVisibility(visibility);
    if (status == PostStatus.published) {
      post.setPublishedAt(Instant.now());
    }
    attachOffer(post, o, 0);
    return postRepository.saveAndFlush(post);
  }
}
