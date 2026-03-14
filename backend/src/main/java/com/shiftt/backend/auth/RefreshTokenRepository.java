package com.shiftt.backend.auth;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends MongoRepository<RefreshToken, String> {

    Optional<RefreshToken> findByTokenId(String tokenId);

    Optional<RefreshToken> findByTokenIdAndRevokedFalse(String tokenId);

    java.util.List<RefreshToken> findAllByUserIdAndRevokedFalse(String userId);

    long deleteByUserId(String userId);
}
