import sys
import funcoes

def funcaoPrincipal(login, senha, full=False):
    print("LOG: Iniciando processo de sincronização...", flush=True)
    driver = None
    try:
        driver = funcoes.abrir()
        funcoes.entrar(driver, login, senha)
        
        # 1. Aluno (Imprime imediato)
        nome, curso, total_creditos, total_horas = funcoes.coletaDadosPessoais(driver)
        funcoes.gerar_sql_aluno(login, nome, curso, total_creditos, total_horas)

        # 1.1 Eletivas Universais
        if (full):
            funcoes.coletaEletivasUniversais(driver)

        # 2. Grade (Imprime de 10 em 10 durante a execução)
        #funcoes.coletaMateriasCurriculo(driver, curso)

        # 3. Em Andamento (Imprime de 10 em 10 durante a execução)
        #funcoes.coletaMateriasEmAndamento(driver, login)

        # 4. Histórico (Imprime de 10 em 10 durante a execução)
        funcoes.coletaMateriasRealizadas(driver, login)
        
        print("LOG: Sincronização concluída com sucesso.", flush=True)

    except KeyboardInterrupt:
        print("LOG: Processo interrompido pelo usuário (Ctrl+C).", flush=True)

    except Exception as e:
        if("conexão" in str(e) or "login" in str(e)):
            print(f"LOG: Erro inesperado: {str(e)}", flush=True)
        else:
            print("LOG: Erro inesperado: Falha no scrapping - "+str(e), flush=True)
    finally:
        if driver:
            driver.quit()
        print("LOG: Processo finalizado.", flush=True)

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        full = False
        if len(sys.argv) >= 4:
            full = sys.argv[3].lower() in ("true", "1", "yes", "full")

        funcaoPrincipal(sys.argv[1], sys.argv[2], full)
    else:
        print("LOG: Argumentos insuficientes.", flush=True)