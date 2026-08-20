package com.healthaitracker.controller;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SpaForwardControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @ParameterizedTest
    @ValueSource(strings = {
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
    void forwardsOnlyKnownReactRoutesToThePackagedIndex(String route) throws Exception {
        mockMvc.perform(get(route))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    void statusEndpointRemainsPublic() throws Exception {
        mockMvc.perform(get("/api/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Health Tracker Backend Running"));
    }

    @Test
    void localViteCorsAllowListRemainsAvailable() throws Exception {
        mockMvc.perform(options("/api/status")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    @WithMockUser
    void unknownApiRouteRemainsANotFoundApiResponse() throws Exception {
        mockMvc.perform(get("/api/does-not-exist"))
                .andExpect(status().isNotFound())
                .andExpect(forwardedUrl(null))
                .andExpect(jsonPath("$.message").value("Resource not found"));
    }

    @Test
    void missingStaticAssetRemainsNotFound() throws Exception {
        mockMvc.perform(get("/assets/does-not-exist.js"))
                .andExpect(status().isNotFound())
                .andExpect(forwardedUrl(null))
                .andExpect(content().string(not(containsString("<div id=\"root\">"))));
    }
}
