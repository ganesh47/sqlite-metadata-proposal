package com.sqlite.metadata.forwarder.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.sqlite.metadata.client.model.NodePayload;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ForwardEvent(
    @JsonProperty("id") String id,
    @JsonProperty("type") String type,
    @JsonProperty("properties") Map<String, Object> properties,
    @JsonProperty("createdBy") String createdBy,
    @JsonProperty("updatedBy") String updatedBy) {

  public NodePayload toNodePayload() {
    return new NodePayload(id, type, properties, createdBy, updatedBy);
  }
}
