package br.com.yuri.aluno_online.infrastructure.auth;

import br.com.yuri.aluno_online.application.auth.service.TokenService;
import br.com.yuri.aluno_online.domain.model.Aluno;
import br.com.yuri.aluno_online.infrastructure.repository.AlunoRepository; // Certifique-se de importar seu repository
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class SecurityFilter extends OncePerRequestFilter {

    private final TokenService tokenService;
    private final AlunoRepository alunoRepository;

    // Injetamos o repository para buscar o aluno completo pelo login/matrícula vindo do token
    public SecurityFilter(TokenService tokenService, AlunoRepository alunoRepository) {
        this.tokenService = tokenService;
        this.alunoRepository = alunoRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String token = recuperarToken(request);
        
        if (token != null) {
            String identificador = tokenService.validarToken(token); // Agora é um UUID
            
            if (identificador != null) {
                try {
                    // MUDANÇA: Buscamos pelo ID (UUID) que é imutável
                    java.util.UUID uuid = java.util.UUID.fromString(identificador);
                    Aluno aluno = alunoRepository.findById(uuid).orElse(null);

                    if (aluno != null) {
                        var authentication = new UsernamePasswordAuthenticationToken(
                            aluno, 
                            null, 
                            aluno.getAuthorities()
                        );
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                } catch (IllegalArgumentException e) {
                    // Caso o UUID no token esteja em formato inválido
                    logger.error("UUID inválido no token");
                }
            }
        }
        
        filterChain.doFilter(request, response);
    }

    private String recuperarToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        return authHeader.replace("Bearer ", "");
    }
}