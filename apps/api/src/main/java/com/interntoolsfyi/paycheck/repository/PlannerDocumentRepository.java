package com.interntoolsfyi.paycheck.repository;

import com.interntoolsfyi.paycheck.model.PlannerDocument;
import com.interntoolsfyi.user.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.context.annotation.Profile;
import org.springframework.data.mongodb.repository.MongoRepository;

@Profile("!test")
public interface PlannerDocumentRepository extends MongoRepository<PlannerDocument, String> {
    List<PlannerDocument> findByUserOrderByCreatedAtDesc(User user);

    Optional<PlannerDocument> findByIdAndUser(String id, User user);
}
