package br.com.yuri.aluno_online.domain.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "professor")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Professor {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nome;
}