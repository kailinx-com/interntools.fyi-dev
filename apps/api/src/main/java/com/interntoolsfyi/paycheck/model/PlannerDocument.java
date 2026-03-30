package com.interntoolsfyi.paycheck.model;

import com.interntoolsfyi.user.model.User;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.Instant;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

/** MongoDB document for persisted budget planner JSON payloads. */
@Document(collection = "paycheck_planner_documents")
@CompoundIndex(name = "user_created_at_idx", def = "{'user_id': 1, 'created_at': -1}")
public class PlannerDocument {

  @Id @Getter private String id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  @Field("user_id")
  @Getter
  @Setter
  private User user;

  @Getter @Setter private String name;

  @Getter @Setter private Map<String, Object> data;

  @Field("created_at")
  @Getter
  @Setter
  private Instant createdAt;
}
