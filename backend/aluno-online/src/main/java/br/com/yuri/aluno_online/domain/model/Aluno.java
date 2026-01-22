package br.com.yuri.aluno_online.domain.model;

import br.com.yuri.aluno_online.domain.enums.StatusMatricula;
import br.com.yuri.aluno_online.domain.enums.Role;

import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "aluno")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Aluno implements UserDetails { // 1. Implementar UserDetails

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(length = 50, nullable = false) 
    private Role role;

    @Column(nullable = false)
    private String nome;

    @Column(unique = true, nullable = false)
    private Long matricula;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_curso", foreignKey = @ForeignKey(name = "fk_aluno_curso"))
    private Curso curso;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status_matricula")
    private StatusMatricula statusMatricula;

    @Column(name = "email_institucional", unique = true, nullable = false)
    private String emailInstitucional;

    @Column(name = "periodo_inicio")
    private String periodoInicio;

    @Column(name = "senha_hash", nullable = false)
    private String senhaHash;

    public void setSenhaHash(String senhaHash) {
        this.senhaHash = senhaHash;
    }

    // ======================================================
    // MÉTODOS OBRIGATÓRIOS DO USERDETAILS
    // ======================================================

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Retorna a role do aluno (ex: ROLE_ALUNO, ROLE_ADMIN)
        return List.of(new SimpleGrantedAuthority("ROLE_" + this.role.name()));
    }

    @Override
    public String getPassword() {
        return this.senhaHash;
    }

    @Override
    public String getUsername() {
        // O username para o Spring será o e-mail institucional
        return this.emailInstitucional;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true; // Conta nunca expira
    }

    @Override
    public boolean isAccountNonLocked() {
        // Se no futuro você quiser bloquear alunos inativos, use:
        // return this.statusMatricula != StatusMatricula.Inativo;
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true; // Senha nunca expira
    }

    @Override
    public boolean isEnabled() {
        return true; // Conta habilitada
    }
}
