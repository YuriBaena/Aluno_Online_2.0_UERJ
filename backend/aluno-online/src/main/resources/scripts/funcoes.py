from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import sys

# --- FUNÇÕES AUXILIARES PARA SQL ---

def format_val(val):
    if val is None or str(val).strip() == "" or str(val).strip() == "-": 
        return "NULL"
    if isinstance(val, (int, float)): 
        return str(val)
    val_clean = str(val).replace("'", "''")
    return f"'{val_clean}'"

def imprimir_bloco_sql(sql):
    """Encapsula o SQL com as tags que o seu Java espera."""
    print("SQL_START", flush=True)
    print(sql, flush=True)
    print("SQL_END", flush=True)

def gerar_sql_aluno(matricula, nome, curso):
    val_matricula = format_val(matricula)
    val_nome = format_val(nome)
    val_curso = format_val(curso)

    # AJUSTES REALIZADOS:
    # 1. Alterado 'nome' para 'nome_curso' na tabela curso (conforme seu INIT).
    # 2. Adicionado casting ::bigint para a matrícula.
    # 3. A lógica de busca por similaridade (%) exige que o valor não seja NULL.
    
    sql = f"""
    WITH curso_data AS (
        INSERT INTO public.curso (nome_curso)
        VALUES ({val_curso})
        ON CONFLICT (nome_curso) DO UPDATE SET nome_curso = EXCLUDED.nome_curso
        RETURNING id
    ),
    aluno_target AS (
        SELECT a.id 
        FROM public.aluno a
        WHERE a.nome % {val_nome}
        ORDER BY a.nome <-> {val_nome}
        LIMIT 1
    )
    UPDATE public.aluno
    SET 
        matricula = {val_matricula}::bigint,
        id_curso = (SELECT id FROM curso_data)
    FROM aluno_target
    WHERE public.aluno.id = aluno_target.id;
    """.replace('\n', ' ').strip()
    
    imprimir_bloco_sql(sql)

# --- FUNÇÕES DE NAVEGAÇÃO ---

def abrir():
    print("LOG: Abrindo navegador...", flush=True)
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    driver.get("https://www.alunoonline.uerj.br/")
    driver.implicitly_wait(10)
    return driver

def entrar(driver, login, senha):
    print(f"LOG: Tentando logar com {login}...", flush=True)
    perto = driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/table/tbody')
    perto.find_element(By.XPATH, ".//tr[2]/td[2]/input").send_keys(login)
    driver.find_element(By.XPATH, ".//tr[3]/td[2]/input").send_keys(senha)
    driver.find_element(By.XPATH, './/tr[4]/td/button').click()
    WebDriverWait(driver, 15).until(EC.visibility_of_element_located((By.XPATH, '/html/body/table/tbody/tr[1]/td/div/div[2]/div[1]/font')))
    print("LOG: Login efetuado com sucesso.", flush=True)

def coletaDadosPessoais(driver):
    print("LOG: Coletando dados pessoais...", flush=True)
    tudo = driver.find_element(By.XPATH, '/html/body/table/tbody/tr[1]/td/div/div[2]/div[1]/font').text
    nome = str(tudo.split("-")[1]).strip()

    driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/table/tbody/tr[2]/td[3]/div[2]/div[15]/a').click()
    
    curso = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.XPATH, '/html/body/table/tbody/tr[3]/td/div[2]/div/div[2]/div[1]/div[3]'))).text.split(": ")[1].strip()
    
    try:
        driver.find_element(By.XPATH, '/html/body/table/tbody/tr[2]/td/table/tbody/tr/td/a[1]').click()
    except:
        driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/div[4]/button').click()      

    print("LOG: Nome e Curso coletados", flush=True)
    return nome, curso

def coletaMateriasCurriculo(driver, curso):
    print(f"LOG: Acessando Grade Curricular do curso: {curso}...", flush=True)
    try:
        driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/table/tbody/tr[2]/td[3]/div[2]/div[3]/a').click()
    except:
        driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/table/tbody/tr[4]/td[3]/div[2]/div[3]/a').click()

    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.XPATH, '/html/body/table/tbody/tr[3]/td/form/div[1]/div[2]/table/tbody')))
    linhas = driver.find_elements(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/div[1]/div[2]/table/tbody/tr[position() >= 2]')
    num_linhas = len(linhas)
    
    batch_disciplinas = []
    
    # AJUSTE SQL: Alterado 'nome' para 'nome_curso' para bater com o INIT
    sql_header = f"""
    WITH curso_cte AS (
        INSERT INTO public.curso (nome_curso)
        VALUES ({format_val(curso)})
        ON CONFLICT (nome_curso) DO UPDATE SET nome_curso = EXCLUDED.nome_curso
        RETURNING id
    )
    """

    for i in range(num_linhas):
        try:
            # Re-localiza as linhas para evitar StaleElementReferenceException após navegação
            linhas = driver.find_elements(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/div[1]/div[2]/table/tbody/tr[position() >= 2]')
            tr = linhas[i]
            tds = tr.find_elements(By.TAG_NAME, "td")
            if len(tds) < 9: continue

            if (i + 1) % 10 == 0 or i == 0:
                print(f"LOG: Processando matéria {i+1} de {num_linhas}...", flush=True)

            tipo, periodo = tds[3].text, tds[1].text
            tds[0].find_element(By.TAG_NAME, "a").click()
            
            # Extração dos dados da disciplina
            disciplina_elem = WebDriverWait(driver, 10).until(EC.visibility_of_element_located((By.XPATH, '/html/body/table/tbody/tr[3]/td/form/div[1]/div/div[2]/div[1]/div[1]')))
            texto_disc = disciplina_elem.text.split(": ")[1].split("    ")[0]
            codigo = texto_disc.split(" ")[0]
            nome_disc = " ".join(texto_disc.split(" ")[1:]).replace(",", "").replace("-", " ")
            
            creditos = driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/div[1]/div/div[2]/div[1]/div[2]/div[1]').text.split(": ")[1]
            chT = driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/div[1]/div/div[2]/div[1]/div[2]/div[2]').text.split(": ")[1]
            p_val = periodo if periodo.isdigit() else "NULL"

            # Adiciona ao lote
            batch_disciplinas.append(f"({format_val(codigo)}, {format_val(nome_disc)}, {creditos}, {chT}, {format_val(tipo)}, {p_val})")

            # Quando atingir o limite do lote, gera o SQL
            if len(batch_disciplinas) == 10:
                valores = ", ".join(batch_disciplinas)
                # AJUSTE SQL: Garantindo tipos SMALLINT para compatibilidade total com o INIT
                sql = f"""
                {sql_header}
                INSERT INTO public.disciplina (codigo, nome, creditos, carga_horaria, tipo, periodo, id_curso)
                SELECT v.cod, v.nom, v.cre::smallint, v.ch::smallint, v.tip, v.per::smallint, curso_cte.id
                FROM (VALUES {valores}) AS v(cod, nom, cre, ch, tip, per), curso_cte
                ON CONFLICT (codigo) DO UPDATE SET 
                    nome = EXCLUDED.nome, 
                    id_curso = EXCLUDED.id_curso;
                """.replace('\n', ' ').strip()
                
                imprimir_bloco_sql(sql)
                batch_disciplinas = []

            # Volta para a listagem
            try:
                driver.find_element(By.XPATH, '/html/body/table/tbody/tr[2]/td/table/tbody/tr/td/a[1]').click()
            except:
                driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/div[2]/button').click()
            
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.XPATH, '/html/body/table/tbody/tr[3]/td/form/div[1]/div[2]/table/tbody')))
            
        except Exception as e:
            print(f"ERRO na linha {i}: {e}")
            continue

    # Processa as disciplinas restantes (último lote)
    if batch_disciplinas:
        valores = ", ".join(batch_disciplinas)
        # AJUSTE SQL: Mesmas correções de tipos e colunas aplicadas aqui
        sql = f"""
        {sql_header}
        INSERT INTO public.disciplina (codigo, nome, creditos, carga_horaria, tipo, periodo, id_curso)
        SELECT v.cod, v.nom, v.cre::smallint, v.ch::smallint, v.tip, v.per::smallint, curso_cte.id
        FROM (VALUES {valores}) AS v(cod, nom, cre, ch, tip, per), curso_cte
        ON CONFLICT (codigo) DO UPDATE SET 
            nome = EXCLUDED.nome, 
            id_curso = EXCLUDED.id_curso;
        """.replace('\n', ' ').strip()
        
        imprimir_bloco_sql(sql)

    # Finalização
    try:
        driver.find_element(By.XPATH, '/html/body/table/tbody/tr[2]/td/table/tbody/tr/td/a[1]').click()
    except:
        driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/div[2]/button').click()

def coletaMateriasRealizadas(driver, login):
    print("LOG: Coletando Histórico acadêmico...", flush=True)
    try:
        driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/table/tbody/tr[2]/td[3]/div[2]/div[13]/a').click()
    except:
        driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/table/tbody/tr[4]/td[3]/div[2]/div[13]/a').click()

    ant = ""
    batch_hist = []
    try:
        perto = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.XPATH, '/html/body/table/tbody/tr[3]/td/form/div/div[1]/div[2]/table/tbody')))
        linhas = perto.find_elements(By.XPATH, ".//tr[position() >= 2]")

        for tr in linhas:
            try:
                tds = tr.find_elements(By.TAG_NAME, "td")
                if len(tds) < 8: continue
                codigo = tds[1].find_element(By.TAG_NAME, "a").text.split(" ")[0]
                freq = tds[5].text.replace("%", "").strip()
                nota = tds[6].text.replace(",", ".").strip()
                situacao = tds[7].text.strip()
                ar = tds[0].find_element(By.TAG_NAME, "b").text.strip()
                
                ano_realizado = ar if ar != "" else ant
                ant = ano_realizado
                
                # Prepara os valores para o batch
                batch_hist.append(f"({format_val(codigo)}, {format_val(nota)}, {format_val(freq)}, {format_val(situacao)}, {format_val(ano_realizado)})")

                if len(batch_hist) == 10:
                    valores = ", ".join(batch_hist)
                    # AJUSTE SQL: Subquery para UUID, correção de nome de coluna e ON CONFLICT
                    sql = f"""
                    INSERT INTO public.historico (id_aluno, codigo_disciplina, nota_final, frequencia, status, periodo_realizado)
                    SELECT a.id, v.cod, v.nota::decimal, v.frq::decimal, v.st, v.per
                    FROM (VALUES {valores}) AS v(cod, nota, frq, st, per)
                    JOIN public.aluno a ON a.matricula = {login}::bigint
                    ON CONFLICT (id_aluno, codigo_disciplina) DO UPDATE SET
                        nota_final = EXCLUDED.nota_final,
                        frequencia = EXCLUDED.frequencia,
                        status = EXCLUDED.status;
                    """.replace('\n', ' ').strip()
                    imprimir_bloco_sql(sql)
                    batch_hist = []
            except: continue
            
        if batch_hist:
            valores = ", ".join(batch_hist)
            # AJUSTE SQL: Mesma lógica para o lote restante
            sql = f"""
            INSERT INTO public.historico (id_aluno, codigo_disciplina, nota_final, frequencia, status, periodo_realizado)
            SELECT a.id, v.cod, v.nota::decimal, v.frq::decimal, v.st, v.per
            FROM (VALUES {valores}) AS v(cod, nota, frq, st, per)
            JOIN public.aluno a ON a.matricula = {login}::bigint
            ON CONFLICT (id_aluno, codigo_disciplina) DO UPDATE SET
                nota_final = EXCLUDED.nota_final,
                frequencia = EXCLUDED.frequencia,
                status = EXCLUDED.status;
            """.replace('\n', ' ').strip()
            imprimir_bloco_sql(sql)
            
    except: pass
    driver.find_element(By.XPATH, '/html/body/table/tbody/tr[2]/td/table/tbody/tr/td/a[1]').click()
