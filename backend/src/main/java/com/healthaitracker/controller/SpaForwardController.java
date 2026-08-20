package com.healthaitracker.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping({
            "/",
            "/login",
            "/signup",
            "/onboarding",
            "/health",
            "/nutrition",
            "/activity",
            "/goals",
            "/progress",
            "/more"
    })
    public String forwardKnownReactRoute() {
        return "forward:/index.html";
    }
}
