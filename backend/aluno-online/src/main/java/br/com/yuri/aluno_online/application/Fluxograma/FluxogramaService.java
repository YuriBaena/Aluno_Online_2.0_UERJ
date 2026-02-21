package br.com.yuri.aluno_online.application.Fluxograma;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import br.com.yuri.aluno_online.infrastructure.repository.FluxogramaRepository;
import br.com.yuri.aluno_online.infrastructure.web.FluxogramaResource;
import br.com.yuri.aluno_online.infrastructure.web.FluxogramaResource.DisciplinaFluxogramaDTO;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Service
public class FluxogramaService {

    private final FluxogramaRepository repository;
    private final ObjectMapper objectMapper;

    public FluxogramaService(FluxogramaRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public List<DisciplinaFluxogramaDTO> fluxograma(UUID alunoId) {
        return repository.findFluxogramaRaw(alunoId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    private FluxogramaResource.DisciplinaFluxogramaDTO mapToDTO(Map<String, Object> row) {
        try {
            String jsonRequisitos = (String) row.get("grupos_requisitos_json");
            var requisitos = jsonRequisitos != null 
                ? objectMapper.readValue(jsonRequisitos, new TypeReference<List<FluxogramaResource.RequisitoGrupoDTO>>() {}) 
                : List.<FluxogramaResource.RequisitoGrupoDTO>of();

            return new FluxogramaResource.DisciplinaFluxogramaDTO(
                (String) row.get("codigo"),
                (String) row.get("nome"),
                convertToInt(row.get("periodo")),
                convertToInt(row.get("creditos")),
                (String) row.get("status_historico"),
                (BigDecimal) row.get("nota_final"),
                requisitos
            );
        } catch (Exception e) {
            return new FluxogramaResource.DisciplinaFluxogramaDTO(
                (String) row.get("codigo"), (String) row.get("nome"), 0, 0, null, null, List.of()
            );
        }
    }

    private Integer convertToInt(Object val) {
        return (val instanceof Number n) ? n.intValue() : 0;
    }

}
