import sys
import funcoes

def funcaoPrincipal(login, senha):
    print("LOG: Iniciando processo de sincronização...", flush=True)
    driver = None
    try:
        driver = funcoes.abrir()
        funcoes.entrar(driver, login, senha)
        
        # 1. Aluno (Imprime imediato)
        nome, curso = funcoes.coletaDadosPessoais(driver)
        funcoes.gerar_sql_aluno(login, nome, curso)

        # 2. Grade (Imprime de 10 em 10 durante a execução)
        funcoes.coletaMateriasCurriculo(driver, curso)
        
        # 3. Histórico (Imprime de 10 em 10 durante a execução)
        funcoes.coletaMateriasRealizadas(driver, login)
        
        print("LOG: Sincronização concluída com sucesso.", flush=True)

    except KeyboardInterrupt:
        print("LOG: Processo interrompido pelo usuário (Ctrl+C).", flush=True)

    except Exception as e:
        if("conexão" in str(e) or "login" in str(e)):
            print(f"LOG: Erro inesperado: {str(e)}", flush=True)
        else:
            print("LOG: Erro inesperado: Falha na coleta de dados", flush=True)
    finally:
        if driver:
            driver.quit()
        print("LOG: Processo finalizado.", flush=True)

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        funcaoPrincipal(sys.argv[1], sys.argv[2])
    else:
        print("LOG: Argumentos insuficientes.", flush=True)