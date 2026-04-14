package com.interntoolsfyi.offer.dto;

public record PostOfferItemRequest(
    Long offerId, String company, String role, String compensationText) {}
