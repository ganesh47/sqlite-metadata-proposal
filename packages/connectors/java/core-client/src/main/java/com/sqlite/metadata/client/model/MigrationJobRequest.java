package com.sqlite.metadata.client.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record MigrationJobRequest(
    @JsonProperty("orgId") String orgId,
    @JsonProperty("source") String source,
    @JsonProperty("payload") Map<String, Object> payload) {}
