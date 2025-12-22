package br.com.yuri.aluno_online.domain.model;

import br.com.yuri.aluno_online.domain.enums.StatusMatricula;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "aluno")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Aluno {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Column(unique = true, nullable = false)
    private Long matricula; // Corresponde ao bigint da imagem

    @Enumerated(EnumType.STRING)
    @Column(name = "status_matricula")
    private StatusMatricula statusMatricula;

    @Column(name = "email_institucional", unique = true, nullable = false)
    private String emailInstitucional;

    @Column(name = "periodo_inicio")
    private String periodoInicio; // Ex: "2023.1"

    @Column(name = "senha_hash", nullable = false)
    private String senhaHash;

    // Helper para não salvar senha em texto puro por engano
    public void setSenhaHash(String senha) {
        // Se você já quiser usar o encoder aqui, pode, 
        // mas o ideal é fazer no Service como mostrei antes.
        this.senhaHash = senha;
    }
}