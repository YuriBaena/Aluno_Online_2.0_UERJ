package br.com.yuri.aluno_online.application.auth.service;

import br.com.yuri.aluno_online.infrastructure.repository.AlunoRepository;
import br.com.yuri.aluno_online.application.auth.LoginRequest;
import br.com.yuri.aluno_online.domain.enums.StatusMatricula;
import br.com.yuri.aluno_online.domain.model.Aluno;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

// No seu AuthService.java
@Service
public class AuthService {

    private final AlunoRepository repository;
    private final BCryptPasswordEncoder passwordEncoder;

    // Injete o passwordEncoder no construtor
    public AuthService(AlunoRepository repository) {
        this.repository = repository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public String validarLogin(LoginRequest request) {
        var aluno = repository.findByMatricula(Long.parseLong(request.matricula()))
                .orElseThrow(() -> new RuntimeException("Aluno não encontrado"));

        String senhaDigitada = request.senha().trim();
        String hashDoBanco = aluno.getSenhaHash().trim();

        System.out.println("Senha digitada: " + senhaDigitada);
        System.out.println("Hash no banco: " + hashDoBanco);

        if (passwordEncoder.matches(senhaDigitada, hashDoBanco)) {
            return "token-gerado-" + aluno.getId();
        }

        throw new RuntimeException("Senha incorreta");
    }

    public void registrar(Aluno aluno) {
        // Criptografa a senha antes de salvar no banco
        String senhaCriptografada = passwordEncoder.encode(aluno.getSenhaHash());
        aluno.setSenhaHash(senhaCriptografada);
        aluno.setStatusMatricula(StatusMatricula.ATIVO); // Define status inicial
        repository.save(aluno);
    }
}