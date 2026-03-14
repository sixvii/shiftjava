package com.shiftt.backend.auth;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends MongoRepository<PasswordResetToken, String> {

    Optional<PasswordResetToken> findByTokenIdAndUsedFalse(String tokenId);

    long deleteByUserId(String userId);
}