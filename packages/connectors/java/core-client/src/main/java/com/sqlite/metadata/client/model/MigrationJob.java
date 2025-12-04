package com.sqlite.metadata.client.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.OffsetDateTime;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record MigrationJob(
    @JsonProperty("jobId") String jobId,
    @JsonProperty("orgId") String orgId,
    @JsonProperty("source") String source,
    @JsonProperty("status") String status,
    @JsonProperty("metrics") Map<String, Object> metrics,
    @JsonProperty("startedAt") OffsetDateTime startedAt,
    @JsonProperty("completedAt") OffsetDateTime completedAt) {}
