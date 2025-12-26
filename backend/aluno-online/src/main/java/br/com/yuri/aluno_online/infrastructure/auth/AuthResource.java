package br.com.yuri.aluno_online.infrastructure.auth;

import br.com.yuri.aluno_online.application.auth.LoginRequest;
import br.com.yuri.aluno_online.application.auth.service.AuthService;
import br.com.yuri.aluno_online.domain.model.Aluno;
import br.com.yuri.aluno_online.application.auth.service.TokenService;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = {"http://localhost:4200", "https://d2zpn5koefpuib.cloudfront.net"})
public class AuthResource {

    private final AuthService authService;
    private final TokenService tokenService; // Injeção do novo serviço

    public AuthResource(AuthService authService, TokenService tokenService) {
        this.authService = authService;
        this.tokenService = tokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            // 1. Valida se a matrícula e senha existem e estão corretas
            // Certifique-se que validarLogin retorna o objeto Aluno
            var aluno = authService.autenticar(request); 
            
            // 2. Gera o token JWT real usando a matrícula do aluno
            String token = tokenService.gerarToken(aluno);
            
            // 3. Retorna o token para o Angular
            return ResponseEntity.ok(Map.of("token", token));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @PostMapping("/registrar")
    public ResponseEntity<?> registrar(@RequestBody Aluno aluno) {
        authService.registrar(aluno);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}