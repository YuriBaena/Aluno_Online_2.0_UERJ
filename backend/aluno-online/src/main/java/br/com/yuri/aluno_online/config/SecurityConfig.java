package br.com.yuri.aluno_online.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(request -> {
                var corsConfiguration = new org.springframework.web.cors.CorsConfiguration();
                // Autoriza especificamente o seu frontend Angular
                corsConfiguration.setAllowedOrigins(java.util.List.of("http://localhost:4200"));
                // Autoriza os métodos que o Angular vai usar
                corsConfiguration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                // Autoriza todos os cabeçalhos (importante para o Content-Type: application/json)
                corsConfiguration.setAllowedHeaders(java.util.List.of("*"));
                corsConfiguration.setAllowCredentials(true);
                return corsConfiguration;
            }))
            .csrf(csrf -> csrf.disable()) // Mantemos desativado para facilitar o desenvolvimento
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/login").permitAll() // Libera o endpoint de login
                .requestMatchers("/auth/register").permitAll() // Libera o endpoint de register
                .anyRequest().authenticated()
            );

        return http.build();
    }
}