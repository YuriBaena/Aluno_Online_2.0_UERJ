package br.com.yuri.aluno_online.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "avaliacao")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Avaliacao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private UUID idAluno; // Vínculo com o Aluno logado
    private String codigoDisciplina;
    private String nome;
    private String tipo;
    private Integer peso;

    private Double nota;

    private LocalDate dataAgendada;
}