package br.com.yuri.aluno_online.application.myCronograma;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.stereotype.Service;

import br.com.yuri.aluno_online.infrastructure.repository.MyCronogramaRepository;
import br.com.yuri.aluno_online.infrastructure.web.MyCronogramaResource.DisciplinaDTO;
import tools.jackson.databind.ObjectMapper;

@Service
public class MyCronogramaService {

    private final MyCronogramaRepository repository;
    private final ObjectMapper objectMapper;

    public MyCronogramaService(MyCronogramaRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }
    
    public List<DisciplinaDTO> list(String busca, UUID id_aluno) {
        List<String> jsonList = repository.listJson(busca, id_aluno);
        
        return jsonList.stream()
            .map(json -> {
                try {
                    return objectMapper.readValue(json, DisciplinaDTO.class);
                } catch (Exception e) {
                    e.printStackTrace();
                    return null;
                }
            })
            .filter(Objects::nonNull)
            .toList();
    }
}
