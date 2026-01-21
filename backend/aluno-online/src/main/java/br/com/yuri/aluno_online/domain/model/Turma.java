package br.com.yuri.aluno_online.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "turma")
@Data @NoArgsConstructor @AllArgsConstructor
public class Turma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_turma")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "codigo_disciplina", nullable = false)
    private Disciplina disciplina;

    @ManyToOne
    @JoinColumn(name = "id_professor")
    private Professor professor;

    @Column(nullable = false)
    private Short numero;

    @Column(nullable = false)
    private Short vagas;

    @OneToMany(mappedBy = "turma", cascade = CascadeType.ALL)
    private List<HorarioAula> horarios;
}