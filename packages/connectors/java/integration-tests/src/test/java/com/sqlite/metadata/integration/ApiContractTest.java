package com.sqlite.metadata.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.mockserver.client.MockServerClient;
import org.mockserver.model.JsonBody;
import org.testcontainers.containers.MockServerContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@Testcontainers
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ApiContractTest {

  private static final DockerImageName MOCKSERVER_IMAGE =
      DockerImageName.parse("mockserver/mockserver:5.15.0");

  @Container
  static final MockServerContainer apiStub = new MockServerContainer(MOCKSERVER_IMAGE);

  private HttpClient httpClient;
  private String apiBaseUrl;

  @BeforeAll
  void setUpApiStub() {
    httpClient = HttpClient.newHttpClient();
    apiBaseUrl = "http://" + apiStub.getHost() + ":" + apiStub.getServerPort();

    MockServerClient client = new MockServerClient(apiStub.getHost(), apiStub.getServerPort());

    client
        .when(
            org.mockserver.model.HttpRequest.request()
                .withMethod("POST")
                .withPath("/api/v1/connectors/connector-123/heartbeat")
                .withHeader("Content-Type", "application/json")
                .withBody(JsonBody.json("{\"status\":\"ok\"}")))
        .respond(
            org.mockserver.model.HttpResponse.response()
                .withStatusCode(202)
                .withBody(
                    "{\"ack\":true,"
                        + "\"echoPath\":\"/api/v1/connectors/connector-123/heartbeat\"}"));
  }

  @Test
  void connectorHeartbeatIsAccepted() throws Exception {
    HttpRequest request =
        HttpRequest.newBuilder()
            .uri(URI.create(apiBaseUrl + "/api/v1/connectors/connector-123/heartbeat"))
            .timeout(Duration.ofSeconds(5))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString("{\"status\":\"ok\"}"))
            .build();

    HttpResponse<String> response =
        httpClient.send(request, HttpResponse.BodyHandlers.ofString());

    assertEquals(202, response.statusCode(), "heartbeat should be accepted");
    assertTrue(
        response.body().contains("\"ack\":true"),
        "stubbed API should acknowledge heartbeat payloads");
  }
}
