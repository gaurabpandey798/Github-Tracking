package com.ideax.codemonitor.repository;

import com.ideax.codemonitor.entity.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SprintRepository extends JpaRepository<Sprint, Long> {
    Optional<Sprint> findBySprintNumber(Integer sprintNumber);
    Optional<Sprint> findByStatus(Sprint.SprintStatus status);
    List<Sprint> findAllByOrderBySprintNumberAsc();
}
