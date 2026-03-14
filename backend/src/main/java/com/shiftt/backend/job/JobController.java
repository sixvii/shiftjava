package com.shiftt.backend.job;

import com.shiftt.backend.shift.ShiftRepository;
import com.shiftt.backend.user.AppUser;
import com.shiftt.backend.user.CurrentUserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
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
import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobRepository jobRepository;
    private final ShiftRepository shiftRepository;
    private final CurrentUserService currentUserService;

    public JobController(JobRepository jobRepository, ShiftRepository shiftRepository, CurrentUserService currentUserService) {
        this.jobRepository = jobRepository;
        this.shiftRepository = shiftRepository;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<JobResponse> list() {
        AppUser user = currentUserService.requireCurrentUser();
        return jobRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(JobResponse::fromEntity)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JobResponse create(@Valid @RequestBody CreateJobRequest request) {
        AppUser user = currentUserService.requireCurrentUser();

        Job job = new Job();
        job.setUserId(user.getId());
        job.setName(request.name().trim());
        job.setHourlyRate(request.hourlyRate());
        job.setColorTag(request.colorTag());

        return JobResponse.fromEntity(jobRepository.save(job));
    }

    @PutMapping("/{jobId}")
    public JobResponse update(@PathVariable String jobId, @Valid @RequestBody UpdateJobRequest request) {
        AppUser user = currentUserService.requireCurrentUser();
        Job job = findOwnedJob(jobId, user);

        job.setName(request.name().trim());
        job.setHourlyRate(request.hourlyRate());
        job.setColorTag(request.colorTag());

        return JobResponse.fromEntity(jobRepository.save(job));
    }

    @DeleteMapping("/{jobId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String jobId) {
        AppUser user = currentUserService.requireCurrentUser();
        Job job = findOwnedJob(jobId, user);

        shiftRepository.deleteByJobIdAndUserId(job.getId(), user.getId());
        jobRepository.delete(job);
    }

    private Job findOwnedJob(String jobId, AppUser user) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (!job.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Job does not belong to current user");
        }

        return job;
    }

    public record CreateJobRequest(
            @NotBlank @Size(max = 100) String name,
            @DecimalMin("0.01") BigDecimal hourlyRate,
            @Size(max = 20) String colorTag
    ) {
    }

        public record UpdateJobRequest(
            @NotBlank @Size(max = 100) String name,
            @DecimalMin("0.01") BigDecimal hourlyRate,
            @Size(max = 20) String colorTag
        ) {
        }

    public record JobResponse(String id, String name, BigDecimal hourlyRate, String colorTag) {
        static JobResponse fromEntity(Job job) {
            return new JobResponse(job.getId(), job.getName(), job.getHourlyRate(), job.getColorTag());
        }
    }
}
