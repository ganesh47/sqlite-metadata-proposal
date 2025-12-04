package com.sqlite.metadata.client.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ConnectorHeartbeat(
    @JsonProperty("status") String status,
    @JsonProperty("latencyP95Ms") Double latencyP95Ms,
    @JsonProperty("throughputPerSec") Double throughputPerSec,
    @JsonProperty("lastBatchSize") Integer lastBatchSize,
    @JsonProperty("observedErrors") List<String> observedErrors) {}
