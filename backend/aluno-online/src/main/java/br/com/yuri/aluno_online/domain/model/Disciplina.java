package br.com.yuri.aluno_online.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "disciplina")
@Data @NoArgsConstructor @AllArgsConstructor
public class Disciplina {

    @Id
    private String codigo;

    @Column(nullable = false)
    private String nome;

    @Column(name = "id_curso")
    private Long idCurso;

    private Short periodo;
    private Short creditos;

    @OneToMany(mappedBy = "disciplina")
    private List<Turma> turmas;
}