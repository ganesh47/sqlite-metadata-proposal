package com.sqlite.metadata.forwarder.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ForwardRequest(
    @JsonProperty("nodes") List<ForwardEvent> nodes,
    @JsonProperty("jobId") String jobId) {}
