package com.sqlite.metadata.client.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record EdgePayload(
    @JsonProperty("id") String id,
    @JsonProperty("sourceId") String sourceId,
    @JsonProperty("targetId") String targetId,
    @JsonProperty("type") String type,
    @JsonProperty("properties") Map<String, Object> properties) {}
