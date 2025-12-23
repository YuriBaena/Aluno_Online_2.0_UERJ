package br.com.yuri.aluno_online.application.auth.service;

import br.com.yuri.aluno_online.infrastructure.repository.AlunoRepository;
import br.com.yuri.aluno_online.application.auth.LoginRequest;
import br.com.yuri.aluno_online.domain.enums.StatusMatricula;
import br.com.yuri.aluno_online.domain.model.Aluno;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AlunoRepository repository;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthService(AlunoRepository repository) {
        this.repository = repository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    // Mudamos o nome para 'autenticar' e o retorno para 'Aluno'
    public Aluno autenticar(LoginRequest request) {
        var aluno = repository.findByMatricula(Long.parseLong(request.matricula()))
                .orElseThrow(() -> new RuntimeException("Aluno não encontrado"));

        if (passwordEncoder.matches(request.senha().trim(), aluno.getSenhaHash().trim())) {
            return aluno; // Retorna o objeto completo se a senha estiver certa
        }

        throw new RuntimeException("Senha incorreta");
    }

    public void registrar(Aluno aluno) {
        String senhaCriptografada = passwordEncoder.encode(aluno.getSenhaHash());
        aluno.setSenhaHash(senhaCriptografada);
        aluno.setStatusMatricula(StatusMatricula.ATIVO);
        repository.save(aluno);
    }
}