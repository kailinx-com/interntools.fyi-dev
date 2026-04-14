package com.interntoolsfyi.offer.service;

import com.interntoolsfyi.offer.dto.PostOfferItemRequest;
import com.interntoolsfyi.offer.model.CompensationType;
import com.interntoolsfyi.offer.model.EmploymentType;
import com.interntoolsfyi.offer.model.Offer;
import com.interntoolsfyi.user.model.User;
import java.util.Locale;

final class PostInlineOfferFactory {

  private PostInlineOfferFactory() {}

  static Offer createInlineOffer(User author, PostOfferItemRequest item) {
    String company = item.company() != null ? item.company().trim() : "";
    if (company.isEmpty()) {
      throw new IllegalArgumentException("company is required for each inline offer");
    }
    Offer o = new Offer();
    o.setUser(author);
    o.setCompany(company);
    o.setTitle(item.role() != null ? item.role().trim() : "");
    o.setEmploymentType(EmploymentType.internship);
    o.setFavorite(Boolean.FALSE);
    applyCompensationFromText(item.compensationText(), o);
    return o;
  }

  static void applyCompensationFromText(String raw, Offer o) {
    if (raw == null || raw.isBlank()) {
      return;
    }
    String trimmed = raw.trim();
    float num = parseMoney(trimmed);
    String lower = trimmed.toLowerCase(Locale.US);
    if (num > 0) {
      if (lower.contains("/hr")) {
        o.setCompensationType(CompensationType.hourly);
        o.setPayAmount(num);
      } else if (lower.contains("/yr") || lower.contains("/year")) {
        o.setCompensationType(CompensationType.monthly);
        o.setPayAmount(num / 12f);
      } else {
        o.setCompensationType(CompensationType.monthly);
        o.setPayAmount(num);
      }
    } else {
      o.setNotes(trimmed);
    }
  }

  private static float parseMoney(String s) {
    try {
      String digits = s.replaceAll("[^0-9.-]", "");
      if (digits.isEmpty()) {
        return 0f;
      }
      return Float.parseFloat(digits);
    } catch (NumberFormatException e) {
      return 0f;
    }
  }
}
