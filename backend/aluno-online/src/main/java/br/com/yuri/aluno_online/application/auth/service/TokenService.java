package br.com.yuri.aluno_online.application.auth.service;

import br.com.yuri.aluno_online.domain.model.Aluno;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;
import java.security.Key;
import java.util.Date;

@Service
public class TokenService {

    // Em produção, essa chave deve vir de uma variável de ambiente
    private final String SECRET_KEY = "minha_chave_secreta_muito_longa_e_segura_para_o_projeto_uerj";
    private final long EXPIRATION_TIME = 86400000; // 24 horas em milisegundos

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    public String gerarToken(Aluno aluno) {
        return Jwts.builder()
                .setSubject(aluno.getMatricula().toString())
                .claim("nome", aluno.getNome())
                .claim("curso", aluno.getCurso())
                .claim("email", aluno.getEmailInstitucional())
                .claim("periodo_inicio", aluno.getPeriodoInicio())
                .claim("role", aluno.getRole().name())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String validarToken(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (Exception e) {
            return null; // Token inválido, expirado ou alterado
        }
    }
}
