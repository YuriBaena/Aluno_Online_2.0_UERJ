package br.com.yuri.aluno_online.application.auth.service;

import br.com.yuri.aluno_online.infrastructure.repository.AlunoRepository;
import br.com.yuri.aluno_online.application.auth.LoginRequest;
import br.com.yuri.aluno_online.domain.enums.Role;
import br.com.yuri.aluno_online.domain.enums.StatusMatricula;
import br.com.yuri.aluno_online.domain.model.Aluno;

import java.time.LocalDate;

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
        // 1. Criptografia e Status
        aluno.setSenhaHash(passwordEncoder.encode(aluno.getSenhaHash()));
        aluno.setStatusMatricula(StatusMatricula.ATIVO);
        if(aluno.getRole() == null) aluno.setRole(Role.ROLE_ALUNO);

        // 2. E-mail Institucional (Cuidado: nomes compostos podem dar erro aqui se o aluno tiver só um nome)
        String[] nomes = aluno.getNome().split(" ");
        String primeiroNome = nomes[0].toLowerCase();
        String sobreNome = nomes.length > 1 ? nomes[1].toLowerCase() : "aluno";
        aluno.setEmailInstitucional(primeiroNome + "." + sobreNome + "@aluno.uerj.br");

        // 3. Período de Início
        LocalDate hoje = LocalDate.now();
        String periodo = hoje.getYear() + "/" + (hoje.getMonthValue() <= 6 ? "1" : "2");
        aluno.setPeriodoInicio(periodo);

        // 4. Matrícula (Ano + 0000000X)
        Long sequencial = repository.getNextMatriculaSequence();
        String matriculaStr = LocalDate.now().getYear() + String.format("%08d", sequencial);
        aluno.setMatricula(Long.parseLong(matriculaStr));
        
        repository.save(aluno);
    }
}