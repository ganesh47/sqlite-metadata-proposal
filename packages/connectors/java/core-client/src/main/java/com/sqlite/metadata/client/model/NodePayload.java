package com.sqlite.metadata.client.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record NodePayload(
    @JsonProperty("id") String id,
    @JsonProperty("type") String type,
    @JsonProperty("properties") Map<String, Object> properties,
    @JsonProperty("createdBy") String createdBy,
    @JsonProperty("updatedBy") String updatedBy) {}
