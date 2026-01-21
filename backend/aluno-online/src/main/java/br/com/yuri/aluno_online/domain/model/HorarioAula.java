package br.com.yuri.aluno_online.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalTime;

@Entity
@Table(name = "horario_aula")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class HorarioAula {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_horario")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "id_turma", nullable = false)
    private Turma turma;

    @Column(nullable = false)
    private String dia; // Ou use um Enum se preferir

    @Column(nullable = false)
    private LocalTime hora;

    @Column(name = "codigo_hora")
    private String codigoHora;
}