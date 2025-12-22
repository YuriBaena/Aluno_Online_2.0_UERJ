package br.com.yuri.aluno_online.infrastructure.auth;

import br.com.yuri.aluno_online.application.auth.LoginRequest;
import br.com.yuri.aluno_online.application.auth.service.AuthService;
import br.com.yuri.aluno_online.domain.model.Aluno;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthResource {

    private final AuthService authService;

    public AuthResource(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            String token = authService.validarLogin(request);
            return ResponseEntity.ok(Map.of("token", token));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registrar(@RequestBody Aluno aluno) {
        authService.registrar(aluno);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}