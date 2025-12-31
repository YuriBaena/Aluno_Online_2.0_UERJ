package br.com.yuri.aluno_online.domain.model;

import br.com.yuri.aluno_online.domain.enums.StatusMatricula;
import br.com.yuri.aluno_online.domain.enums.Role;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "aluno")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Aluno {

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

    @Enumerated(EnumType.STRING)
    @Column(name = "status_matricula", nullable = false)
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

}
