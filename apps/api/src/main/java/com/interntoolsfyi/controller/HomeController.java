package com.interntoolsfyi.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/")
    public Map<String, String> root() {
        return Map.of("message", "Welcome to interntools API", "docs", "Try GET /api/hello or GET /api/home");
    }
}