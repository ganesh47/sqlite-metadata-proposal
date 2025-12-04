package com.sqlite.metadata.client.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
    @JsonProperty("error") String error,
    @JsonProperty("code") String code,
    @JsonProperty("details") List<String> details) {}
