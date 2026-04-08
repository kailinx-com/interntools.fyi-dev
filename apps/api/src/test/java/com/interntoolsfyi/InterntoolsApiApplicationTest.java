package com.interntoolsfyi;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;

class InterntoolsApiApplicationTest {

  @Test
  void mainDelegatesToSpringApplicationRun() {
    try (MockedStatic<SpringApplication> spring = mockStatic(SpringApplication.class)) {
      ConfigurableApplicationContext ctx = mock(ConfigurableApplicationContext.class);
      spring
          .when(() -> SpringApplication.run(eq(InterntoolsApiApplication.class), any(String[].class)))
          .thenReturn(ctx);

      InterntoolsApiApplication.main(new String[] {});
    }
  }
}
