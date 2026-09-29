package com.ideax.codemonitor.repository;

import com.ideax.codemonitor.entity.EventState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EventStateRepository extends JpaRepository<EventState, Integer> {
    default Optional<EventState> getGlobalEventState() {
        return findById(1);
    }
}
