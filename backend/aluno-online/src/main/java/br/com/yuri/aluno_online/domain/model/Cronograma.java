package br.com.yuri.aluno_online.domain.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "cronograma")
@Data
public class Cronograma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_aluno", nullable = false)
    private UUID idAluno;

    @Column(nullable = false)
    private String nome;

    @OneToMany(mappedBy = "cronograma", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DisciplinaCronograma> disciplinas;
}