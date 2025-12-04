package com.sqlite.metadata.client;

import com.sqlite.metadata.client.model.BulkAcknowledge;
import com.sqlite.metadata.client.model.ConnectorHeartbeat;
import com.sqlite.metadata.client.model.EdgeUpsertRequest;
import com.sqlite.metadata.client.model.HealthResponse;
import com.sqlite.metadata.client.model.MigrationJob;
import com.sqlite.metadata.client.model.MigrationJobRequest;
import com.sqlite.metadata.client.model.NodeUpsertRequest;
import java.util.Objects;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

/**
 * Lightweight WebClient-based API client generated from the core OpenAPI contract.
 */
public class MetadataApiClient {

  private final WebClient webClient;

  public MetadataApiClient(WebClient webClient) {
    this.webClient = Objects.requireNonNull(webClient, "webClient");
  }

  public static MetadataApiClient fromBaseUrl(String baseUrl) {
    return new MetadataApiClient(WebClient.builder().baseUrl(baseUrl).build());
  }

  public Mono<HealthResponse> getHealthReady() {
    return webClient.get().uri("/health/ready").retrieve().bodyToMono(HealthResponse.class);
  }

  public Mono<BulkAcknowledge> upsertNodes(String orgId, NodeUpsertRequest request) {
    return webClient
        .post()
        .uri(uriBuilder -> uriBuilder.path("/orgs/{orgId}/nodes").build(orgId))
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(request)
        .retrieve()
        .bodyToMono(BulkAcknowledge.class);
  }

  public Mono<BulkAcknowledge> upsertEdges(String orgId, EdgeUpsertRequest request) {
    return webClient
        .post()
        .uri(uriBuilder -> uriBuilder.path("/orgs/{orgId}/edges").build(orgId))
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(request)
        .retrieve()
        .bodyToMono(BulkAcknowledge.class);
  }

  public Mono<MigrationJob> createMigrationJob(MigrationJobRequest request) {
    return webClient
        .post()
        .uri("/ingest/jobs")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(request)
        .retrieve()
        .bodyToMono(MigrationJob.class);
  }

  public Mono<MigrationJob> getMigrationJob(String jobId) {
    return webClient
        .get()
        .uri(uriBuilder -> uriBuilder.path("/ingest/jobs/{jobId}").build(jobId))
        .retrieve()
        .bodyToMono(MigrationJob.class);
  }

  public Mono<Void> reportConnectorHeartbeat(String connectorId, ConnectorHeartbeat heartbeat) {
    return webClient
        .post()
        .uri(uriBuilder -> uriBuilder.path("/connectors/{connectorId}/heartbeat").build(connectorId))
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(heartbeat)
        .retrieve()
        .bodyToMono(Void.class)
        .onErrorResume(
            WebClientResponseException.class,
            ex -> ex.getStatusCode().isError() ? Mono.error(ex) : Mono.empty());
  }
}
