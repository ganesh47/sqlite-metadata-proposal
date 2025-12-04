package com.sqlite.metadata.forwarder.api;

import com.sqlite.metadata.client.MetadataApiClient;
import com.sqlite.metadata.client.model.NodePayload;
import com.sqlite.metadata.client.model.NodeUpsertRequest;
import com.sqlite.metadata.connector.config.ConnectorProperties;
import com.sqlite.metadata.forwarder.model.ForwardEvent;
import com.sqlite.metadata.forwarder.model.ForwardRequest;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.time.Duration;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/events")
@Validated
public class ForwardController {
  private static final Logger log = LoggerFactory.getLogger(ForwardController.class);

  private final MetadataApiClient apiClient;
  private final ConnectorProperties props;
  private final Counter forwardCounter;
  private final Timer forwardTimer;

  public ForwardController(
      MetadataApiClient apiClient, ConnectorProperties props, MeterRegistry registry) {
    this.apiClient = apiClient;
    this.props = props;
    this.forwardCounter = registry.counter("forwarder.requests");
    this.forwardTimer = registry.timer("forwarder.latency");
  }

  @PostMapping
  public Mono<ResponseEntity<Void>> forward(@RequestBody ForwardRequest request) {
    if (request.nodes() == null || request.nodes().isEmpty()) {
      return Mono.just(ResponseEntity.badRequest().build());
    }

    List<NodePayload> nodes = request.nodes().stream().map(ForwardEvent::toNodePayload).toList();
    NodeUpsertRequest upsert =
        new NodeUpsertRequest(nodes, request.jobId());

    return apiClient
        .upsertNodes(props.getOrgId(), upsert)
        .timeout(Duration.ofSeconds(5))
        .doOnSubscribe(sub -> forwardCounter.increment(nodes.size()))
        .transformDeferred(
            mono ->
                Mono.defer(
                    () ->
                        Mono.fromCallable(
                            () ->
                                forwardTimer.recordCallable(
                                    () -> mono.block(Duration.ofSeconds(6))))))
        .map(ack -> ResponseEntity.accepted().<Void>build())
        .doOnError(err -> log.warn("Forward failed: {}", err.getMessage()))
        .onErrorReturn(ResponseEntity.status(HttpStatus.BAD_GATEWAY).build());
  }
}
