package com.sqlite.metadata.connector;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ConnectorTemplateApplication {

  public static void main(String[] args) {
    SpringApplication.run(ConnectorTemplateApplication.class, args);
  }
}
