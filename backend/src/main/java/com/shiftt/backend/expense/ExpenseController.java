package com.shiftt.backend.expense;

import com.shiftt.backend.user.AppUser;
import com.shiftt.backend.user.CurrentUserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseRepository expenseRepository;
    private final CurrentUserService currentUserService;

    public ExpenseController(ExpenseRepository expenseRepository, CurrentUserService currentUserService) {
        this.expenseRepository = expenseRepository;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<ExpenseResponse> list() {
        AppUser user = currentUserService.requireCurrentUser();
        return expenseRepository.findAllByUserIdOrderByDateDescCreatedAtDesc(user.getId())
                .stream()
                .map(ExpenseResponse::fromEntity)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseResponse create(@Valid @RequestBody CreateExpenseRequest request) {
        AppUser user = currentUserService.requireCurrentUser();

        Expense expense = new Expense();
        expense.setUserId(user.getId());
        expense.setDate(request.date());
        expense.setAmount(request.amount());
        expense.setCategory(request.category().trim());
        expense.setNote(request.note());

        return ExpenseResponse.fromEntity(expenseRepository.save(expense));
    }

    @PutMapping("/{expenseId}")
    public ExpenseResponse update(@PathVariable String expenseId, @Valid @RequestBody UpdateExpenseRequest request) {
        AppUser user = currentUserService.requireCurrentUser();
        Expense expense = findOwnedExpense(expenseId, user);

        expense.setDate(request.date());
        expense.setAmount(request.amount());
        expense.setCategory(request.category().trim());
        expense.setNote(request.note());

        return ExpenseResponse.fromEntity(expenseRepository.save(expense));
    }

    @DeleteMapping("/{expenseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String expenseId) {
        AppUser user = currentUserService.requireCurrentUser();
        Expense expense = findOwnedExpense(expenseId, user);
        expenseRepository.delete(expense);
    }

    private Expense findOwnedExpense(String expenseId, AppUser user) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Expense not found"));

        if (!expense.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Expense does not belong to current user");
        }

        return expense;
    }

    public record CreateExpenseRequest(
            @NotNull LocalDate date,
            @NotNull @DecimalMin("0.01") BigDecimal amount,
            @NotBlank @Size(max = 120) String category,
            @Size(max = 300) String note
    ) {
    }

        public record UpdateExpenseRequest(
            @NotNull LocalDate date,
            @NotNull @DecimalMin("0.01") BigDecimal amount,
            @NotBlank @Size(max = 120) String category,
            @Size(max = 300) String note
        ) {
        }

    public record ExpenseResponse(String id, LocalDate date, BigDecimal amount, String category, String note) {
        static ExpenseResponse fromEntity(Expense expense) {
            return new ExpenseResponse(
                    expense.getId(),
                    expense.getDate(),
                    expense.getAmount(),
                    expense.getCategory(),
                    expense.getNote()
            );
        }
    }
}
