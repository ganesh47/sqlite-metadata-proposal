package com.sqlite.metadata.client.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record HealthResponse(
    @JsonProperty("status") String status,
    @JsonProperty("version") String version,
    @JsonProperty("sqlite") SqliteStatus sqlite) {

  @JsonInclude(JsonInclude.Include.NON_NULL)
  public record SqliteStatus(
      @JsonProperty("wal_checkpointed") Boolean walCheckpointed,
      @JsonProperty("migrations") String migrations) {}
}
