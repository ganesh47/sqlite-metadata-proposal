package com.sqlite.metadata.forwarder;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@ComponentScan(basePackages = {"com.sqlite.metadata.forwarder", "com.sqlite.metadata.connector"})
public class HttpForwarderApplication {

  public static void main(String[] args) {
    SpringApplication.run(HttpForwarderApplication.class, args);
  }
}
