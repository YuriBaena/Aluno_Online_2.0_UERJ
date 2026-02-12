package br.com.yuri.aluno_online.domain.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "curso")
@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
public class Curso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome_curso", nullable = false, unique = true)
    private String nomeCurso;

    @Column(name = "total_creditos", nullable = false, columnDefinition = "SMALLINT DEFAULT 0")
    private int totalCreditos;

    @Column(name = "total_horas", nullable = false, columnDefinition = "SMALLINT DEFAULT 0")
    private int totalHoras;
}

