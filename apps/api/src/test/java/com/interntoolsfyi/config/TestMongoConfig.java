package com.interntoolsfyi.config;

import static org.mockito.Mockito.mock;

import com.interntoolsfyi.paycheck.service.PaycheckPlannerService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("test")
public class TestMongoConfig {

  @Bean
  PaycheckPlannerService paycheckPlannerService() {
    return mock(PaycheckPlannerService.class);
  }
}
