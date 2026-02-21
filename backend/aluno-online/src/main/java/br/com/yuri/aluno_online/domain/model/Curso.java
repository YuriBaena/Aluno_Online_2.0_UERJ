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

    @Builder.Default
    @Column(name = "total_creditos", nullable = false)
    @org.hibernate.annotations.ColumnDefault("0")
    private Short totalCreditos = 0;

    @Builder.Default
    @Column(name = "total_horas", nullable = false)
    @org.hibernate.annotations.ColumnDefault("0")
    private Short totalHoras = 0;
}

