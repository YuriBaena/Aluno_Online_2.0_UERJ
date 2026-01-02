package br.com.yuri.aluno_online.domain.model;

import br.com.yuri.aluno_online.domain.enums.StatusSincronizacao;

import java.time.OffsetDateTime;
import java.util.UUID;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "sincronizacao")
@Data
public class Sincronizacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_aluno", nullable = false)
    private UUID idAluno;

    @Enumerated(EnumType.STRING) // IMPORTANTE: Salva o nome (EX: "COMPLETO") no banco
    @Column(name = "status_sinc", nullable = false)
    private StatusSincronizacao statusSinc;

    @Column(name = "data_inicio")
    private OffsetDateTime dataInicio;

    @Column(name = "data_fim")
    private OffsetDateTime dataFim;

    @Column(columnDefinition = "TEXT")
    private String detalhes;

    @PrePersist
    protected void onCreate() {
        this.dataInicio = OffsetDateTime.now();
        if (this.statusSinc == null) {
            this.statusSinc = StatusSincronizacao.PENDENTE;
        }
    }
}
