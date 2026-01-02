package br.com.yuri.aluno_online.application.sync;

import br.com.yuri.aluno_online.domain.enums.StatusSincronizacao;
import br.com.yuri.aluno_online.infrastructure.repository.ScraperRepository;
import br.com.yuri.aluno_online.infrastructure.exception.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.Arrays;

@Service
public class ScraperService {

    private final ScraperRepository scraperRepository;
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Value("${scraping.python.path}")
    private String pythonExecutable;

    @Value("${scraping.script.path}")
    private String scriptPath;

    public ScraperService(ScraperRepository scraperRepository) {
        this.scraperRepository = scraperRepository;
    }

    /**
     * Inicia a sincronização de forma assíncrona.
     * O idAluno é necessário para vincular os logs ao registro correto na tabela.
     */
    @Async
    public void executarSincronizacao(UUID idAluno, String login, String senha) {
        // 1. Cria o registro inicial no banco de dados para rastreamento
        scraperRepository.criarSincronizacao(idAluno);
        logConsole("SISTEMA", "Iniciando thread de sincronização para o aluno ID: " + idAluno);

        try {
            // Preparação do comando para o processo Python
            List<String> command = Arrays.asList(pythonExecutable, scriptPath, login, senha);
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);

            Process process = pb.start();
            boolean isSqlBlock = false;

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {

                    // A) CAPTURA E TRATAMENTO DE LOGS
                    if (line.startsWith("LOG: ")) {
                        String message = line.substring(5);
                        logConsole("PYTHON", message);

                        // Mapeamento de logs para suas Exceptions personalizadas
                        if (message.toLowerCase().contains("login") || message.toLowerCase().contains("inválidas")) {
                            throw new LoginInvalidoException();
                        }
                        
                        if (message.toLowerCase().contains("conexão") || message.toLowerCase().contains("scrapping")) {
                            throw new PortalIndisponivelException();
                        }

                        if (message.toLowerCase().contains("coleta") || message.toLowerCase().contains("dados")) {
                            throw new IntegrationException("Erro técnico no motor de busca: " + message);
                        }

                        // Se não for erro, atualiza o progresso no banco
                        scraperRepository.atualizarStatus(idAluno, StatusSincronizacao.PROCESSANDO, message);
                        continue;
                    }

                    // B) PROCESSAMENTO DE SQL (Apenas se não houver erro)
                    if (line.equals("SQL_START")) { isSqlBlock = true; continue; }
                    if (line.equals("SQL_END")) { isSqlBlock = false; continue; }

                    if (isSqlBlock && !line.trim().isEmpty()) {
                        processarLinhaSql(line);
                    }
                }
            }

            // Aguarda a finalização do processo
            int exitCode = process.waitFor();
            
            if (exitCode == 0) {
                scraperRepository.atualizarStatus(idAluno, StatusSincronizacao.COMPLETO, "Dados sincronizados com sucesso.");
                logConsole("SISTEMA", "Sincronização finalizada com sucesso.");
            } else {
                throw new IntegrationException("O processo encerrou com código de saída: " + exitCode);
            }

        } catch (LoginInvalidoException e) {
            tratarErroSincronizacao(idAluno, e.getMessage());
        } catch (PortalIndisponivelException e) {
            tratarErroSincronizacao(idAluno, e.getMessage());
        } catch (IntegrationException e) {
            tratarErroSincronizacao(idAluno, "Erro de Integração: " + e.getMessage());
        } catch (Exception e) {
            tratarErroSincronizacao(idAluno, "Erro Crítico Inesperado: " + e.getMessage());
        }
    }

    /**
     * Centraliza a atualização de erro no repositório e log de erro
     */
    private void tratarErroSincronizacao(UUID idAluno, String mensagem) {
        logError("SYNC_ERROR", mensagem);
        scraperRepository.atualizarStatus(idAluno, StatusSincronizacao.ERRO, mensagem);
        
        // Opcional: Aqui você poderia disparar um alerta ou notificação push
    }

    /**
     * Executa o SQL em uma transação isolada para evitar timeouts de conexão
     */
    @Transactional(rollbackFor = Exception.class)
    public void processarLinhaSql(String sql) {
        try {
            scraperRepository.executarComandoSql(sql);
        } catch (Exception e) {
            logError("DB-SYNC", "Erro ao executar SQL: " + sql);
            // Não relançamos a exceção aqui para não matar o processo Python, 
            // mas logamos o erro no banco.
        }
    }

    /**
     * Chamado pelo Controller para responder ao Angular (Polling)
     */
    public Map<String, Object> obterStatusSincronizacao(UUID id_aluno) {
        return scraperRepository.obterStatusCompleto(id_aluno);
    }

    public String buscarUltimaDataPorId(UUID idAluno) {
        return scraperRepository.buscarUltimaDataPorId(idAluno);
    }

    // --- MÉTODOS DE LOG PARA O CONSOLE DO SPRING ---

    private void logConsole(String tag, String message) {
        String timestamp = LocalDateTime.now().format(DATE_FORMAT);
        System.out.println("[" + timestamp + "] [" + tag + "]: " + message);
    }

    private void logError(String tag, String message) {
        String timestamp = LocalDateTime.now().format(DATE_FORMAT);
        System.err.println("[" + timestamp + "] [" + tag + "]: " + message);
    }
}