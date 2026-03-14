package com.shiftt.backend.job;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface JobRepository extends MongoRepository<Job, String> {

    List<Job> findAllByUserIdOrderByCreatedAtDesc(String userId);

    long deleteAllByUserId(String userId);
}
