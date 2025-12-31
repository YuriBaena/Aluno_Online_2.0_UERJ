package br.com.yuri.aluno_online.application.sync;

import br.com.yuri.aluno_online.infrastructure.repository.ScraperRepository;
import br.com.yuri.aluno_online.infrastructure.exception.LoginInvalidoException;
import br.com.yuri.aluno_online.infrastructure.exception.PortalIndisponivelException;
import br.com.yuri.aluno_online.infrastructure.exception.IntegrationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class ScraperService {

    private final ScraperRepository scraperRepository;
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public ScraperService(ScraperRepository scraperRepository) {
        this.scraperRepository = scraperRepository;
    }

    @Value("${scraping.python.path:python3}")
    private String pythonExecutable;

    @Value("${scraping.script.path:src/main/resources/scripts/main.py}")
    private String scriptPath;

    /**
     * O método agora é @Async. Ele não deve ter @Transactional aqui 
     * para não segurar uma conexão com o banco durante o tempo de execução do Python.
     */
    @Async
    public void executarSincronizacao(String login, String senha) {
        try {
            List<String> command = new ArrayList<>();
            command.add(pythonExecutable);
            command.add(scriptPath);
            command.add(login);
            command.add(senha);

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);

            Process process = pb.start();
            boolean isSqlBlock = false;

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    
                    // 1. Captura de Progresso
                    if (line.startsWith("LOG: ")) {
                        String logMessage = line.substring(5);
                        logConsole("SCRAPER-LOG", logMessage);
                        tratarErrosPython(logMessage);
                        continue;
                    }

                    // 2. Controle de Fluxo SQL
                    if (line.equals("SQL_START")) {
                        isSqlBlock = true;
                        continue;
                    }
                    if (line.equals("SQL_END")) {
                        isSqlBlock = false;
                        continue;
                    }

                    // 3. Execução SQL (Delegada para método transacional)
                    if (isSqlBlock && !line.trim().isEmpty()) {
                        processarLinhaSql(line);
                    }
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                logError("SISTEMA", "Falha técnica. Exit Code: " + exitCode);
            } else {
                logConsole("SISTEMA", "Sincronização finalizada com sucesso.");
            }

        } catch (Exception e) {
            logError("CRITICAL-ERROR", e.getMessage());
            // Nota: Em métodos @Async, exceptions não sobem para o Controller.
            // O ideal aqui seria atualizar um status no banco de dados.
        }
    }

    /**
     * Abre uma transação curta apenas para executar o comando SQL.
     * Isso resolve o erro de "Connection closed" por timeout.
     */
    @Transactional(rollbackFor = Exception.class)
    public void processarLinhaSql(String sql) {
        try {
            scraperRepository.executarComandoSql(sql);
        } catch (Exception e) {
            logError("ERRO DB", "Falha no SQL gerado: " + sql);
            throw new IntegrationException("Erro ao persistir dados: " + e.getMessage());
        }
    }

    private void tratarErrosPython(String message) {
        String lowerMessage = message.toLowerCase();
        boolean indicativoErro = lowerMessage.contains("erro") || lowerMessage.contains("falha") || lowerMessage.contains("inválid");

        if (indicativoErro) {
            if (lowerMessage.contains("login") || lowerMessage.contains("senha") || lowerMessage.contains("autenticação")) {
                throw new LoginInvalidoException();
            }
            if (lowerMessage.contains("timeout") || lowerMessage.contains("indisponível") || lowerMessage.contains("fora do ar")) {
                throw new PortalIndisponivelException();
            }
            throw new IntegrationException("Erro no scraper: " + message);
        }
    }

    private void logConsole(String tag, String message) {
        String timestamp = LocalDateTime.now().format(DATE_FORMAT);
        System.out.println("[" + timestamp + "] [" + tag + "]: " + message);
    }

    private void logError(String tag, String message) {
        String timestamp = LocalDateTime.now().format(DATE_FORMAT);
        System.err.println("[" + timestamp + "] [" + tag + "]: " + message);
    }
}