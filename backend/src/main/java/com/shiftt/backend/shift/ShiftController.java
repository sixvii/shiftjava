package com.shiftt.backend.shift;

import com.shiftt.backend.job.Job;
import com.shiftt.backend.job.JobRepository;
import com.shiftt.backend.user.AppUser;
import com.shiftt.backend.user.CurrentUserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
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
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/shifts")
public class ShiftController {

    private final ShiftRepository shiftRepository;
    private final JobRepository jobRepository;
    private final CurrentUserService currentUserService;

    public ShiftController(ShiftRepository shiftRepository, JobRepository jobRepository, CurrentUserService currentUserService) {
        this.shiftRepository = shiftRepository;
        this.jobRepository = jobRepository;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<ShiftResponse> list() {
        AppUser user = currentUserService.requireCurrentUser();
        return shiftRepository.findAllByUserIdOrderByDateDescCreatedAtDesc(user.getId())
                .stream()
                .map(ShiftResponse::fromEntity)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ShiftResponse create(@Valid @RequestBody CreateShiftRequest request) {
        AppUser user = currentUserService.requireCurrentUser();
        Job job = findOwnedJob(request.jobId(), user);

        Shift shift = new Shift();
        shift.setUserId(user.getId());
        shift.setJobId(job.getId());
        shift.setDate(request.date());
        shift.setStartTime(request.startTime());
        shift.setEndTime(request.endTime());
        shift.setTips(request.tips() == null ? BigDecimal.ZERO : request.tips());
        shift.setPremiums(request.premiums() == null ? BigDecimal.ZERO : request.premiums());

        return ShiftResponse.fromEntity(shiftRepository.save(shift));
    }

    @PutMapping("/{shiftId}")
    public ShiftResponse update(@PathVariable String shiftId, @Valid @RequestBody UpdateShiftRequest request) {
        AppUser user = currentUserService.requireCurrentUser();
        Shift shift = findOwnedShift(shiftId, user);
        Job job = findOwnedJob(request.jobId(), user);

        shift.setJobId(job.getId());
        shift.setDate(request.date());
        shift.setStartTime(request.startTime());
        shift.setEndTime(request.endTime());
        shift.setTips(request.tips() == null ? BigDecimal.ZERO : request.tips());
        shift.setPremiums(request.premiums() == null ? BigDecimal.ZERO : request.premiums());

        return ShiftResponse.fromEntity(shiftRepository.save(shift));
    }

    @DeleteMapping("/{shiftId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String shiftId) {
        AppUser user = currentUserService.requireCurrentUser();
        Shift shift = findOwnedShift(shiftId, user);
        shiftRepository.delete(shift);
    }

    private Job findOwnedJob(String jobId, AppUser user) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (!job.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Job does not belong to current user");
        }

        return job;
    }

    private Shift findOwnedShift(String shiftId, AppUser user) {
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shift not found"));

        if (!shift.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Shift does not belong to current user");
        }

        return shift;
    }

    public record CreateShiftRequest(
            @NotNull String jobId,
            @NotNull LocalDate date,
            @NotNull LocalDateTime startTime,
            @NotNull LocalDateTime endTime,
            @DecimalMin("0.00") BigDecimal tips,
            @DecimalMin("0.00") BigDecimal premiums
    ) {
    }

        public record UpdateShiftRequest(
            @NotNull String jobId,
            @NotNull LocalDate date,
            @NotNull LocalDateTime startTime,
            @NotNull LocalDateTime endTime,
            @DecimalMin("0.00") BigDecimal tips,
            @DecimalMin("0.00") BigDecimal premiums
        ) {
        }

    public record ShiftResponse(
            String id,
            String jobId,
            LocalDate date,
            LocalDateTime startTime,
            LocalDateTime endTime,
            BigDecimal tips,
            BigDecimal premiums
    ) {
        static ShiftResponse fromEntity(Shift shift) {
            return new ShiftResponse(
                    shift.getId(),
                    shift.getJobId(),
                    shift.getDate(),
                    shift.getStartTime(),
                    shift.getEndTime(),
                    shift.getTips(),
                    shift.getPremiums()
            );
        }
    }
}
