package com.ideax.codemonitor.repository;

import com.ideax.codemonitor.entity.WebhookDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WebhookDeliveryRepository extends JpaRepository<WebhookDelivery, Long> {
    Optional<WebhookDelivery> findByDeliveryId(String deliveryId);
    boolean existsByDeliveryId(String deliveryId);
}
