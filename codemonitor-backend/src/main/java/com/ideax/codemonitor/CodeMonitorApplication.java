package com.ideax.codemonitor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableAsync
public class CodeMonitorApplication {

    public static void main(String[] args) {
        SpringApplication.run(CodeMonitorApplication.class, args);
    }
}
