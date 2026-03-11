package com.interntoolsfyi.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public Map<String, String> root() {
        return Map.of("message", "Welcome to interntools API", "docs", "Try GET /api/hello or GET /api/home");
    }

    @GetMapping("/home")
    public Map<String, String> home() {
        return Map.of("message", "interntools API home");
    }
}