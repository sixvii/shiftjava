package com.shiftt.backend.shift;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ShiftRepository extends MongoRepository<Shift, String> {

    List<Shift> findAllByUserIdOrderByDateDescCreatedAtDesc(String userId);

    boolean existsByJobIdAndUserId(String jobId, String userId);

    long deleteByJobIdAndUserId(String jobId, String userId);

    long deleteAllByUserId(String userId);
}
