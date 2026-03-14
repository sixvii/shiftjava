package com.shiftt.backend.expense;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ExpenseRepository extends MongoRepository<Expense, String> {

    List<Expense> findAllByUserIdOrderByDateDescCreatedAtDesc(String userId);

    long deleteAllByUserId(String userId);
}
