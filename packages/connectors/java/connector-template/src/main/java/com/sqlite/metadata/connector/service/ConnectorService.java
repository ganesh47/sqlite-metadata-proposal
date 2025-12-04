package com.sqlite.metadata.connector.service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

/**
 * Minimal batching + retry helper for connector ingestion.
 *
 * <p>The implementation is intentionally small so it can be reused by future connector templates
 * and covered by unit tests today.
 */
public class ConnectorService {

  private final WebClient webClient;
  private final int batchSize;
  private final int maxRetries;
  private final Duration backoff;

  public ConnectorService(WebClient webClient, int batchSize, int maxRetries, Duration backoff) {
    if (batchSize <= 0) {
      throw new IllegalArgumentException("batchSize must be > 0");
    }
    this.webClient = webClient;
    this.batchSize = batchSize;
    this.maxRetries = Math.max(0, maxRetries);
    this.backoff = backoff == null ? Duration.ofSeconds(1) : backoff;
  }

  public Mono<Void> sendRecords(List<String> records) {
    if (records == null || records.isEmpty()) {
      return Mono.empty();
    }

    List<List<String>> batches = partition(records);
    Mono<Void> pipeline = Mono.empty();

    for (List<String> batch : batches) {
      pipeline =
          pipeline.then(
              webClient
                  .post()
                  .uri("/ingest")
                  .body(BodyInserters.fromValue(batch))
                  .retrieve()
                  .onStatus(HttpStatusCode::is5xxServerError, response -> Mono.error(new TransientApiException()))
                  .bodyToMono(Void.class)
                  .retryWhen(Retry.backoff(maxRetries, backoff).filter(TransientApiException.class::isInstance)));
    }

    return pipeline;
  }

  List<List<String>> partition(List<String> records) {
    if (records == null || records.isEmpty()) {
      return Collections.emptyList();
    }

    List<List<String>> batches = new ArrayList<>();
    for (int i = 0; i < records.size(); i += batchSize) {
      int end = Math.min(records.size(), i + batchSize);
      batches.add(new ArrayList<>(records.subList(i, end)));
    }
    return batches;
  }

  public static class TransientApiException extends RuntimeException {
    private static final long serialVersionUID = 1L;
  }
}
