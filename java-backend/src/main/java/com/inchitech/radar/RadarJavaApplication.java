package com.inchitech.radar;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RadarJavaApplication {

    public static void main(String[] args) {
        SpringApplication.run(RadarJavaApplication.class, args);
    }
}
