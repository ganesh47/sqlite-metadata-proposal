package com.sqlite.metadata.connector.config;

import com.sqlite.metadata.client.MetadataApiClient;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@EnableConfigurationProperties(ConnectorProperties.class)
public class WebClientConfig {

  @Bean
  public MetadataApiClient metadataApiClient(WebClient.Builder webClientBuilder, ConnectorProperties props) {
    WebClient webClient =
        webClientBuilder
            .baseUrl(props.getApiBaseUrl())
            .build();
    return new MetadataApiClient(webClient);
  }
}
