package com.sqlite.metadata.connector.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.sqlite.metadata.connector.service.ConnectorService.TransientApiException;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.test.StepVerifier;

class ConnectorServiceTest {

  private MockWebServer mockServer;
  private ConnectorService connectorService;

  @BeforeEach
  void setUp() throws Exception {
    mockServer = new MockWebServer();
    mockServer.start();

    WebClient webClient =
        WebClient.builder().baseUrl(mockServer.url("/").toString()).build();

    connectorService =
        new ConnectorService(webClient, 2, /*maxRetries=*/ 2, Duration.ofMillis(50));
  }

  @AfterEach
  void tearDown() throws Exception {
    mockServer.shutdown();
  }

  @Test
  @DisplayName("Partitions records into configured batch sizes")
  void partitionsIntoBatches() {
    List<List<String>> batches =
        connectorService.partition(Arrays.asList("a", "b", "c", "d", "e"));

    assertThat(batches)
        .hasSize(3)
        .containsExactly(
            Arrays.asList("a", "b"), Arrays.asList("c", "d"), Arrays.asList("e"));
  }

  @Test
  @DisplayName("Retries transient 5xx responses up to configured max")
  void retriesOnTransientFailures() {
    mockServer.enqueue(new MockResponse().setResponseCode(500));
    mockServer.enqueue(new MockResponse().setResponseCode(502));
    mockServer.enqueue(new MockResponse().setResponseCode(202));

    StepVerifier.create(connectorService.sendRecords(List.of("a", "b")))
        .verifyComplete();

    assertThat(mockServer.getRequestCount()).isEqualTo(3);
  }

  @Test
  @DisplayName("Stops retrying when max attempts exhausted")
  void stopsAfterMaxRetries() {
    mockServer.enqueue(new MockResponse().setResponseCode(500));
    mockServer.enqueue(new MockResponse().setResponseCode(500));
    mockServer.enqueue(new MockResponse().setResponseCode(500));

    StepVerifier.create(connectorService.sendRecords(List.of("a")))
        .expectErrorMatches(
            err ->
                err.getCause() instanceof TransientApiException
                    || err instanceof TransientApiException)
        .verify();

    assertThat(mockServer.getRequestCount()).isEqualTo(3);
  }

  @Test
  @DisplayName("Rejects invalid batch size")
  void rejectsInvalidBatchSize() {
    assertThatThrownBy(
            () ->
                new ConnectorService(WebClient.builder().build(), 0, 1, Duration.ofMillis(10)))
        .isInstanceOf(IllegalArgumentException.class);
  }
}
