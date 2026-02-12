package br.com.yuri.aluno_online.domain.model;

import java.util.List;

import jakarta.persistence.*;
import lombok.Data;

import br.com.yuri.aluno_online.infrastructure.web.SaveCronResource.Horarios;

@Entity
@Table(name = "disciplina_cronograma")
@Data
public class DisciplinaCronograma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "id_cronograma", nullable = false)
    private Cronograma cronograma;

    @Column(name = "codigo_disciplina", length = 50)
    private String codigoDisciplina;

    @Column(name = "nome_disciplina")
    private String nomeDisciplina;

    @Column(name = "nome_professor")
    private String nomeProfessor;

    @Column(name = "horarios", columnDefinition = "jsonb")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    private List<Horarios> horarios;
}