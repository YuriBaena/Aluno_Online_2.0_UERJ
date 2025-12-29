package br.com.yuri.aluno_online.domain.model;

import br.com.yuri.aluno_online.domain.enums.StatusMatricula;
import br.com.yuri.aluno_online.domain.enums.Role;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "aluno")
@SequenceGenerator(name = "matricula_seq", sequenceName = "aluno_matricula_seq", allocationSize = 1)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Aluno {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private String nome;

    @Column(unique = true, nullable = false)
    private Long matricula;

    @Column
    private String curso;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_matricula")
    private StatusMatricula statusMatricula;

    @Column(name = "email_institucional", unique = true, nullable = false)
    private String emailInstitucional;

    @Column(name = "periodo_inicio")
    private String periodoInicio; 

    @Column(name = "senha_hash", nullable = false)
    private String senhaHash;

    // Este campo só serve para o Hibernate criar a sequence no banco
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "matricula_seq")
    @Column(name = "temp_sequence_trigger", insertable = false, updatable = false)
    private Long counter;

    public void setSenhaHash(String senha) {
        this.senhaHash = senha;
    }
}