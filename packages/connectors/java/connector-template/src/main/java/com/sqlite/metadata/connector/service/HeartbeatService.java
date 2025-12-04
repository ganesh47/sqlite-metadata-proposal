package com.sqlite.metadata.connector.service;

import com.sqlite.metadata.client.MetadataApiClient;
import com.sqlite.metadata.client.model.ConnectorHeartbeat;
import java.time.Duration;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class HeartbeatService {
  private static final Logger log = LoggerFactory.getLogger(HeartbeatService.class);

  private final MetadataApiClient apiClient;
  private final String connectorId;

  public HeartbeatService(MetadataApiClient apiClient, String connectorId) {
    this.apiClient = apiClient;
    this.connectorId = connectorId;
  }

  @Scheduled(fixedDelayString = "${metadata.connector.heartbeat-interval-ms:10000}")
  public void sendHeartbeat() {
    ConnectorHeartbeat heartbeat =
        new ConnectorHeartbeat("ready", 50.0, 200.0, 100, List.of());

    apiClient
        .reportConnectorHeartbeat(connectorId, heartbeat)
        .timeout(Duration.ofSeconds(5))
        .doOnError(err -> log.warn("Heartbeat failed: {}", err.getMessage()))
        .onErrorResume(err -> Mono.empty())
        .block();
  }
}
