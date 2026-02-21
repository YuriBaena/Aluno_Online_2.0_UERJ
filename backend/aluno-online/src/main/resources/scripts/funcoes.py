from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import NoSuchElementException
import traceback
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
    print(sql.strip(), flush=True)
    print("SQL_END", flush=True)

def gerar_sql_aluno(matricula, nome, curso, creditos, horas):
    val_matricula = format_val(matricula)
    val_nome = format_val(nome)
    val_curso = format_val(curso)
    val_creditos = format_val(creditos)
    val_horas = format_val(horas)

    sql = f"""
    WITH curso_data AS (
        INSERT INTO public.curso (nome_curso, total_creditos, total_horas)
        VALUES ({val_curso}, {val_creditos}, {val_horas})
        ON CONFLICT (nome_curso) DO UPDATE SET 
            total_creditos = EXCLUDED.total_creditos,
            total_horas = EXCLUDED.total_horas
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
        matricula = CAST({val_matricula} AS bigint),
        id_curso = (SELECT id FROM curso_data)
    FROM aluno_target
    WHERE public.aluno.id = aluno_target.id;
    """.replace('\n', ' ').strip()
    
    imprimir_bloco_sql(sql)

# --- FUNÇÕES DE NAVEGAÇÃO ---

def abrir():
    print("LOG: Abrindo navegador...", flush=True)
    try:
        options = Options()
        options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.page_load_strategy = 'eager'
        options.add_argument("--blink-settings=imagesEnabled=false")
        options.add_argument("--disable-extensions")
        options.add_argument("--no-first-run")

        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
        driver.get("https://www.alunoonline.uerj.br/")
        driver.implicitly_wait(2)
        return driver
    except:
        raise Exception("Falha na conexão para scrapping")

def entrar(driver, login, senha):
    print(f"LOG: Tentando logar com {login}...", flush=True)
    try:
        perto = driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/table/tbody')
        perto.find_element(By.XPATH, ".//tr[2]/td[2]/input").send_keys(login)
        driver.find_element(By.XPATH, ".//tr[3]/td[2]/input").send_keys(senha)
        driver.find_element(By.XPATH, './/tr[4]/td/button').click()
        WebDriverWait(driver, 7).until(EC.visibility_of_element_located((By.XPATH, '/html/body/table/tbody/tr[3]/td/form/table/tbody/tr[2]/td[3]/div[2]/div[3]/a')))
        print("LOG: Login efetuado com sucesso.", flush=True)
    except:
        raise Exception("Informações para login inválidas.")

# --- DADOS PESSOAIS ---

def coletaDadosPessoais(driver):
    print("LOG: Coletando dados pessoais...", flush=True)
    wait = WebDriverWait(driver, 5)

    # tudo = "matricula - nome"
    tudo = driver.find_element(By.XPATH, '/html/body/table/tbody/tr[1]/td/div/div[2]/div[1]/font').text
    nome = tudo.split("-", 1)[1].strip()

    # Entra Síntese da Formação
    wait.until(EC.element_to_be_clickable((By.XPATH, '/html/body/table/tbody/tr[3]/td/form/table/tbody/tr[2]/td[3]/div[2]/div[15]/a'))).click()

    curso, total_creditos, total_horas = pegaDadosPessoaisSinteseFormacao(driver, wait)

    # Volta para pagina inicial
    try:
        driver.find_element(By.XPATH, '/html/body/table/tbody/tr[2]/td/table/tbody/tr/td/a[1]').click()
    except NoSuchElementException:
        driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/div[4]/button').click()

    print("LOG: Nome e Curso coletados", flush=True)
    return nome, curso, total_creditos, total_horas

def pegaDadosPessoaisSinteseFormacao(driver, wait):
    curso = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/table/tbody/tr[3]/td/div[2]/div/div[2]/div[1]/div[3]'))).text.split(": ", 1)[1].strip()

    total_creditos = 0
    total_horas = 0
    tabela = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/table/tbody/tr[3]/td/div[2]/div/div[2]/div[4]/div[2]/table/tbody')))
    linhas = tabela.find_elements(By.XPATH, './tr')

    for linha in linhas[1:]:
        try:
            texto = linha.find_element(By.XPATH, './td[1]').text.strip().lower()
            if not any(x in texto for x in ["atividade", "carga horária"]):
                total_creditos += int(linha.find_element(By.XPATH, './td[3]').text.strip())
            else:
                total_horas += int(linha.find_element(By.XPATH, './td[3]').text.strip())
        except ValueError:
            continue
    
    return curso, total_creditos, total_horas

# -- TODAS MATERIAS DO CURRICULO 

def coletaMateriasCurriculo(driver, curso):
    print(f"LOG: Iniciando extração sequencial para: {curso}...", flush=True)
    
    mapa_dias = {"SEG": "Segunda", "TER": "Terca", "QUA": "Quarta", "QUI": "Quinta", "SEX": "Sexta", "SAB": "Sabado"}
    mapa_horarios = {"M1": "07:00", "M2": "07:50", "M3": "08:50", "M4": "09:40", "M5": "10:40", "M6": "11:30", "T1": "12:30", "T2": "13:20", "T3": "14:20", "T4": "15:10", "T5": "16:10", "T6": "17:00", "N1": "18:00", "N2": "18:50", "N3": "19:40", "N4": "20:30", "N5": "21:20"}

    try:
        driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/table/tbody/tr[2]/td[3]/div[2]/div[3]/a').click()
    except:
        driver.find_element(By.XPATH, '//a[contains(@href, "curriculo")]').click()

    WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.XPATH, '//table')))
    
    linhas_xpath = '/html/body/table/tbody/tr[3]/td/form/div[1]/div[2]/table/tbody/tr[position() >= 2]'
    num_linhas = len(driver.find_elements(By.XPATH, linhas_xpath))
    
    for i in range(num_linhas):
        if i % 5 == 0 or i == num_linhas-1:
            print(f"LOG: Extração de materias do curriculo em {100*(i/(num_linhas-1)):.2f}%", flush=True)
        try:
            tr = driver.find_elements(By.XPATH, linhas_xpath)[i]
            tds = tr.find_elements(By.TAG_NAME, "td")
            if len(tds) < 9: continue

            # Captura dados que pertencem à GRADE
            tipo_na_grade, periodo_na_grade = tds[3].text.strip(), tds[1].text.strip()
            per_val = periodo_na_grade if periodo_na_grade.isdigit() else '0'

            tds[0].find_element(By.TAG_NAME, "a").click()
            
            WebDriverWait(driver, 10).until(EC.visibility_of_element_located((By.XPATH, '/html/body/table/tbody/tr[3]/td/form/div[1]/div/div[2]/div[1]/div[1]')))
            
            disc_header = driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/div[1]/div/div[2]/div[1]/div[1]').text
            texto_disc = disc_header.split(": ")[1].split("    ")[0]
            cod = texto_disc.split(" ")[0]
            nom = " ".join(texto_disc.split(" ")[1:]).replace(",", "").replace("-", " ")

            # 1. SQL DISCIPLINA (Apenas dados globais)
            val_creditos = "".join(filter(str.isdigit, driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/div[1]/div/div[2]/div[1]/div[2]/div[1]').text.split(": ")[1])) or "0"
            val_ch = "".join(filter(str.isdigit, driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/div[1]/div/div[2]/div[1]/div[2]/div[2]').text.split(": ")[1])) or "0"

            sql_disc = f"""
            INSERT INTO public.disciplina (codigo, nome, creditos, carga_horaria) 
            VALUES ({format_val(cod)}, {format_val(nom)}, CAST({val_creditos} AS smallint), CAST({val_ch} AS smallint))
            ON CONFLICT (codigo) DO UPDATE SET nome=EXCLUDED.nome, creditos=EXCLUDED.creditos, carga_horaria=EXCLUDED.carga_horaria;
            """.replace('\n', ' ').strip()
            imprimir_bloco_sql(sql_disc)

            # 2. SQL GRADE CURRICULAR (Vínculo curso-disciplina)
            sql_grade = f"""
            INSERT INTO public.grade_curricular (id_curso, codigo_disciplina, periodo, tipo)
            SELECT id, {format_val(cod)}, CAST({per_val} AS smallint), {format_val(tipo_na_grade)}
            FROM public.curso WHERE nome_curso = {format_val(curso)}
            ON CONFLICT (id_curso, codigo_disciplina) DO UPDATE SET periodo=EXCLUDED.periodo, tipo=EXCLUDED.tipo;
            """.replace('\n', ' ').strip()
            imprimir_bloco_sql(sql_grade)

            # 3. Pegar requisitos (Sem alterações na lógica, apenas no SQL de destino)
            try:
                container_req_xpath = '/html/body/table/tbody/tr[3]/td/form/div[1]/div/div[2]/div[2]/div[2]/div'
                divs_requisitos = driver.find_elements(By.XPATH, f'{container_req_xpath}/div')
                grupo_atual = 1

                for div_req in divs_requisitos:
                    tipo_texto = div_req.find_element(By.XPATH, './div[1]').text.strip()
                    if "Pré-Requisito" not in tipo_texto: continue

                    texto_bruto = div_req.find_element(By.XPATH, './div[2]').text.strip()
                    if not texto_bruto or "não possui requisito" in texto_bruto.lower(): continue
                    
                    partes_ou = texto_bruto.replace('\n', ' ou ').replace(' OU ', ' ou ').split(' ou ')
                    for parte in partes_ou:
                        parte = parte.strip()
                        if parte.lower().startswith("ou "): parte = parte[3:].strip()
                        if not parte or len(parte) < 5: continue
                        
                        cod_requisito = parte.split(" ")[0]
                        
                        sql_req = f"""
                        INSERT INTO public.pre_requisito (codigo_disciplina, codigo_requisito, id_grupo)
                        SELECT {format_val(cod)}, {format_val(cod_requisito)}, {grupo_atual}
                        WHERE 
                            EXISTS (SELECT 1 FROM public.disciplina WHERE codigo = {format_val(cod)}) 
                            AND 
                            EXISTS (SELECT 1 FROM public.disciplina WHERE codigo = {format_val(cod_requisito)})
                        ON CONFLICT (codigo_disciplina, codigo_requisito, id_grupo) DO NOTHING;
                        """.replace('\n', ' ').strip()
                        imprimir_bloco_sql(sql_req)
                    grupo_atual += 1
            except Exception as e:
                print(f"LOG: Erro requisitos para {cod}: {e}")

            # 4. Turmas e Horários (Lógica mantida, pois já usavam codigo_disciplina)
            trs_t = driver.find_elements(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/div[1]/div/div[2]/div[3]/div[2]/table/tbody/tr')
            for tr_t in trs_t:
                prof = tr_t.find_element(By.XPATH, './/div[1]/div[5]/div[2]').text.strip().split("\n")[0] or "A DEFINIR"
                num_t = "".join(filter(str.isdigit, tr_t.find_element(By.XPATH, './/div[1]/div[1]/div').text)) or "0"
                vagas_txt = tr_t.find_element(By.XPATH, './/td/div/div[2]/table[1]/tbody/tr[2]/td[2]').text.strip()
                vagas = int(vagas_txt) if vagas_txt.isdigit() else 0

                imprimir_bloco_sql(f"INSERT INTO professor (nome) VALUES ({format_val(prof)}) ON CONFLICT (nome) DO NOTHING;".strip())

                sql_turma = f"INSERT INTO public.turma (codigo_disciplina, id_professor, numero, vagas) VALUES ({format_val(cod)}, (SELECT id FROM professor WHERE nome={format_val(prof)} LIMIT 1), {num_t}, {vagas}) ON CONFLICT (codigo_disciplina, numero) DO UPDATE SET id_professor=EXCLUDED.id_professor, vagas=EXCLUDED.vagas;".strip()
                imprimir_bloco_sql(sql_turma)

                divs_h = tr_t.find_elements(By.XPATH, './/div[1]/div[3]/div[2]/div')
                for h in range(0, len(divs_h), 2):
                    dia_site = divs_h[h].text.strip().upper()
                    tempos = divs_h[h+1].text.strip().split(" ")
                    for t in tempos:
                        if dia_site in mapa_dias and t in mapa_horarios:
                            sql_horario = f"""
                            INSERT INTO public.horario_aula (id_turma, dia, hora, codigo_hora) 
                            VALUES ((SELECT id_turma FROM public.turma WHERE codigo_disciplina={format_val(cod)} AND numero={num_t} LIMIT 1), CAST({format_val(mapa_dias[dia_site])} AS dia_semana_enum), CAST({format_val(mapa_horarios[t])} AS TIME), {format_val(t)}) 
                            ON CONFLICT (id_turma, dia, hora) DO UPDATE SET codigo_hora=EXCLUDED.codigo_hora;
                            """.replace('\n', ' ').strip()
                            imprimir_bloco_sql(sql_horario)

            # Voltar para a lista
            try:
                driver.find_element(By.XPATH, '/html/body/table/tbody/tr[2]/td/table/tbody/tr/td/a[1]').click()
            except:
                driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/div[2]/button').click()
            
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.XPATH, linhas_xpath)))
        except Exception as e:
            print(f"ERRO na linha {i}: {e}")
            continue

    driver.find_element(By.XPATH, '/html/body/table/tbody/tr[2]/td/table/tbody/tr/td/a[1]').click()

# -- MATERIAS JA REALIZADAS

def coletaMateriasRealizadas(driver, login):
    print("LOG: Coletando Histórico acadêmico...", flush=True)
    
    # Abre a página de histórico
    try:
        driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/table/tbody/tr[2]/td[3]/div[2]/div[13]/a').click()
    except:
        driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/table/tbody/tr[4]/td[3]/div[2]/div[13]/a').click()

    try:
        # Captura títulos
        titulo1_elem = driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/div/div[1]/div[1]')
        titulo1 = titulo1_elem.text.strip()
        titulo2_elems = driver.find_elements(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/div/div[2]/div[1]')
        titulo2 = titulo2_elems[0].text.strip() if titulo2_elems else ""
        # Inicializa variáveis
        tbody_disciplinas = None
        tbody_atividades = None

        # Procura tabela de Disciplinas Realizadas
        # Tem que ser a escrita errada mesmo, no aluno online ta errado
        if "Discipinas Realizadas" in titulo1:
            tbodies = titulo1_elem.find_elements(By.XPATH, "following-sibling::div/table/tbody")
            if tbodies:
                tbody_disciplinas = tbodies[0]
        elif titulo2:
            tbodies1 = titulo1_elem.find_elements(By.XPATH, "following-sibling::div/table/tbody")
            tbodies2 = titulo2_elems[0].find_elements(By.XPATH, "following-sibling::div/table/tbody")
            if tbodies1:
                tbody_atividades = tbodies1[0]
            if tbodies2:
                tbody_disciplinas = tbodies2[0]

        # Extrai linhas
        linhas_disciplinas = tbody_disciplinas.find_elements(By.XPATH, ".//tr[position() >= 2]") if tbody_disciplinas else []
        linhas_atividades = tbody_atividades.find_elements(By.XPATH, ".//tr[position() >= 2]") if tbody_atividades else []

        # Chama funções de processamento
        if linhas_disciplinas:
            pegaDisciplinasRealizadas(login, linhas_disciplinas)
        if linhas_atividades:
            pegaAtividadesRealizadas(login, linhas_atividades)
    except Exception as e:
        print(e)

    # Volta para a página anterior
    driver.find_element(By.XPATH, '/html/body/table/tbody/tr[2]/td/table/tbody/tr/td/a[1]').click()

def pegaDisciplinasRealizadas(login, linhas):
    ant = ""
    batch_hist = []
    for tr in linhas:
        try:
            tds = tr.find_elements(By.TAG_NAME, "td")
            if len(tds) < 8: continue
            
            # Parsing dos dados
            texto_link = tds[1].find_element(By.TAG_NAME, "a").text
            codigo = texto_link.split(" ")[0]
            nome = " ".join(texto_link.split(" ")[1:])
            cred = tds[2].text
            ch = tds[3].text
            freq = tds[5].text.replace("%", "").strip() or "0"
            nota = tds[6].text.replace(",", ".").strip() or "0"
            situacao = tds[7].text.strip()
            
            ar = tds[0].find_element(By.TAG_NAME, "b").text.strip()
            ano_realizado = ar if ar != "" else ant
            ant = ano_realizado

            # 1. INSERT na Disciplina (Apenas dados básicos, sem FK de curso aqui)
            sql_disc = f"""
            INSERT INTO public.disciplina (codigo, nome, creditos, carga_horaria)
            VALUES ({format_val(codigo)}, {format_val(nome)}, 
                    CAST({cred} AS smallint), CAST({ch} AS smallint))
            ON CONFLICT (codigo) DO NOTHING;
            """.replace('\n', ' ').strip()
            imprimir_bloco_sql(sql_disc)

            batch_hist.append(f"({format_val(codigo)}, {format_val(nota)}, {format_val(freq)}, {format_val(situacao)}, {format_val(ano_realizado)})")

            if len(batch_hist) == 10:
                # SQL de Histórico permanece igual, pois as FKs de aluno e disciplina continuam
                executar_batch_historico(login, batch_hist)
                batch_hist = []
        except Exception as e:
            continue
            
    if batch_hist:
        executar_batch_historico(login, batch_hist)

# Função auxiliar para não repetir código
def executar_batch_historico(login, batch):
    valores = ", ".join(batch)
    sql = f"""
    INSERT INTO public.historico (id_aluno, codigo_disciplina, nota_final, frequencia, status, periodo_realizado)
    SELECT a.id, v.cod, CAST(v.nota AS decimal), CAST(v.frq AS decimal), v.st, v.per
    FROM (VALUES {valores}) AS v(cod, nota, frq, st, per)
    JOIN public.aluno a ON a.matricula = CAST({login} AS bigint)
    ON CONFLICT (id_aluno, codigo_disciplina) DO UPDATE SET
        nota_final = EXCLUDED.nota_final,
        frequencia = EXCLUDED.frequencia,
        status = EXCLUDED.status;
    """.replace('\n', ' ').strip()
    imprimir_bloco_sql(sql)

def pegaAtividadesRealizadas(login, linhas):
    print("LOG: Limpando histórico do aluno para não existir duplicidade", flush=True)

    sql = f"""
    DELETE FROM public.historico_atividade ha
    USING public.aluno a
    WHERE ha.id_aluno = a.id
    AND a.matricula = CAST({login} AS bigint);
    """.replace('\n', ' ').strip()
    imprimir_bloco_sql(sql)

    ant = ""
    batch_hist = []
    for tr in linhas:
        try:
            tds = tr.find_elements(By.TAG_NAME, "td")
            if len(tds) < 3: continue
            nome = tds[1].text
            ch = tds[2].text
            ar = tds[0].find_element(By.TAG_NAME, "b").text.strip()
            
            ano_realizado = ar if ar != "" else ant
            ant = ano_realizado
            sql_disc = f"""
            INSERT INTO public.atividade (
                nome, max_horas
            )
            SELECT
                {format_val(nome)},
                {format_val(ch)}
            ON CONFLICT (nome) DO NOTHING;
            """.replace('\n', ' ').strip()

            imprimir_bloco_sql(sql_disc)
            batch_hist.append(f"({format_val(nome)},{format_val(ano_realizado)}, {format_val(ch)})")

            if len(batch_hist) == 10:
                valores = ", ".join(batch_hist)
                sql = f"""
                INSERT INTO public.historico_atividade (id_aluno, id_atividade, periodo_realizado, horas_realizadas)
                SELECT a.id, at.id_atividade, v.ano, CAST(v.ch AS smallint)
                FROM (VALUES {valores}) AS v(nome, ano, ch)
                JOIN public.aluno a ON a.matricula = CAST({login} AS bigint)
                JOIN public.atividade at ON at.nome = v.nome
                """.replace('\n', ' ').strip()
                imprimir_bloco_sql(sql)
                batch_hist = []
        except: continue
            
    if batch_hist:
        valores = ", ".join(batch_hist)
        sql = f"""
        INSERT INTO public.historico_atividade (id_aluno, id_atividade, periodo_realizado, horas_realizadas)
        SELECT a.id, at.id_atividade, v.ano, CAST(v.ch AS smallint)
        FROM (VALUES {valores}) AS v(nome, ano, ch)
        JOIN public.aluno a ON a.matricula = CAST({login} AS bigint)
        JOIN public.atividade at ON at.nome = v.nome
        """.replace('\n', ' ').strip()
        imprimir_bloco_sql(sql)

# --- DISCIPLINAS EM ANDAMENTO ---

def coletaMateriasEmAndamento(driver, login):

    print("LOG: Limpando materias feitas no periodo anterior", flush=True)

    # Use format_val para garantir as aspas se necessário e o CAST para garantir o tipo BIGINT
    imprimir_bloco_sql(f"""
        DELETE FROM public.em_andamento
        WHERE id_aluno = (
            SELECT id FROM public.aluno WHERE matricula = CAST({format_val(login)} AS bigint)
        );
    """.replace('\n', ' ').strip())

    print("LOG: Coletando matérias em andamento...", flush=True)
    wait = WebDriverWait(driver, 5)

    # Entra na tela de disciplinas em curso
    wait.until(EC.element_to_be_clickable((By.XPATH, '/html/body/table/tbody/tr[3]/td/form/table/tbody/tr[2]/td[3]/div[2]/div[7]/a'))).click()
    
    lista_dados = [] # Guardaremos tuplas (codigo, turma)

    # Ve se existe materias
    tem_disciplinas = verificarMateriasEmAndamento(driver)
    
    if(tem_disciplinas):
        
        #P ega materias
        lista_dados = pegaDisciplinasEmAndamento(driver)
        
        # Salva materias
        if lista_dados:
            salvaDisciplinasEmAndamento(lista_dados)

    # Volta para tela inicial
    wait.until(EC.element_to_be_clickable((By.XPATH, '/html/body/table/tbody/tr[3]/td/div[2]/form/button'))).click()
    
    return lista_dados

def verificarMateriasEmAndamento(driver):
    xpath_mensagem = "/html/body/table/tbody/tr[3]/td/div[1]/div/div[2]/div[1]"
    
    try:
        # Tenta localizar o elemento da mensagem de "vazio"
        elemento = driver.find_element(By.XPATH, xpath_mensagem)
        if "Não constam disciplinas" in elemento.text:
            print("LOG: Sem disciplinas em andamento", flush=True)
            return False # Não há matérias
    except NoSuchElementException:
        # Se não achar o elemento, assume-se que as matérias estão lá
        pprint("LOG: Possui disciplinas em andamento", flush=True)
        return True

def pegaDisciplinasEmAndamento(driver):

    lista_dados = []

    tabela = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/table/tbody/tr[3]/td/div[1]/div/div[2]/div[1]/table/tbody')))
    linhas = tabela.find_elements(By.XPATH, './tr')

    for linha in linhas[1:]:
        try:
            codigo = linha.find_element(By.XPATH, './td[2]').text.strip().split(" ")[0]
            numero_turma = linha.find_element(By.XPATH, './td[3]').text.strip()
            if codigo:
                lista_dados.append((codigo, numero_turma))
        except NoSuchElementException:
            continue
    
    return lista_dados

def salvaDisciplinasEmAndamento(lista_dados):
    # Criamos a string de valores: ('COD1', '1'), ('COD2', '2')
    valores_sql = ", ".join([f"('{c}', '{t}')" for c, t in lista_dados])
    
    sql_bulk = f"""
    INSERT INTO em_andamento (id_aluno, codigo_disciplina, numero_turma)
    SELECT (SELECT id FROM aluno WHERE matricula = CAST({login} AS bigint)), v.codigo, v.turma::smallint
    FROM (VALUES {valores_sql}) AS v(codigo, turma)
    ON CONFLICT (id_aluno, codigo_disciplina) DO UPDATE SET numero_turma = EXCLUDED.numero_turma;
    """.replace('\n', ' ').strip()
    
    imprimir_bloco_sql(sql_bulk)

# --- DISCIPLINAS UNIVERSAIS ---

def coletaEletivasUniversais(driver):
    print("Log: Pegando eletivas universais")

    mapa_dias = {"SEG": "Segunda", "TER": "Terca", "QUA": "Quarta", "QUI": "Quinta", "SEX": "Sexta", "SAB": "Sabado"}
    mapa_horarios = {"M1": "07:00", "M2": "07:50", "M3": "08:50", "M4": "09:40", "M5": "10:40", "M6": "11:30", "T1": "12:30", "T2": "13:20", "T3": "14:20", "T4": "15:10", "T5": "16:10", "T6": "17:00", "N1": "18:00", "N2": "18:50", "N3": "19:40", "N4": "20:30", "N5": "21:20"}

    try:
        driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/table/tbody/tr[2]/td[3]/div[2]/div[5]/a').click()
    except:
        driver.find_element(By.XPATH, '//a[contains(@href, "universair")]').click()

    WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.XPATH, '//table')))
    
    linhas_xpath = '/html/body/table/tbody/tr[3]/td/form/div[1]/div[2]/table/tbody/tr[position() >= 2]'
    num_linhas = len(driver.find_elements(By.XPATH, linhas_xpath))
    
    for i in range(num_linhas):
        if i % 5 == 0 or i == num_linhas-1:
            print(f"LOG: Extração de eletivas em {100*(i/(max(1, num_linhas-1))):.2f}%", flush=True)
        try:
            tr = driver.find_elements(By.XPATH, linhas_xpath)[i]
            tds = tr.find_elements(By.TAG_NAME, "td")

            if len(tds) < 4: continue 

            val_creditos = "".join(filter(str.isdigit, tds[1].text)) or "0"
            val_ch = "".join(filter(str.isdigit, tds[2].text)) or "0"
            tipo_ele_uni = tds[3].text.strip() # "E. Universal" ou similar

            link_element = tds[0].find_element(By.TAG_NAME, "a")
            texto_completo = link_element.text
            
            # Separação correta de Código e Nome
            partes = texto_completo.split(" - ")
            cod = partes[0].split(" ")[0].strip()
            nom = " ".join(partes[0].split(" ")[1:]).replace(",", "").replace("-", " ")

            # 1. SQL DISCIPLINA (Apenas dados globais)
            sql_disc = f"""
            INSERT INTO public.disciplina (codigo, nome, creditos, carga_horaria) 
            VALUES ({format_val(cod)}, {format_val(nom)}, CAST({val_creditos} AS smallint), CAST({val_ch} AS smallint))
            ON CONFLICT (codigo) DO UPDATE SET nome=EXCLUDED.nome, creditos=EXCLUDED.creditos, carga_horaria=EXCLUDED.carga_horaria;
            """.replace('\n', ' ').strip()
            imprimir_bloco_sql(sql_disc)

            # 2. SQL GRADE CURRICULAR (Vínculo com o curso 'Eletivas Universais')
            sql_grade = f"""
            INSERT INTO public.grade_curricular (id_curso, codigo_disciplina, periodo, tipo)
            SELECT id, {format_val(cod)}, 0, {format_val(tipo_ele_uni)}
            FROM public.curso WHERE nome_curso = 'Eletivas Universais'
            ON CONFLICT (id_curso, codigo_disciplina) DO UPDATE SET tipo=EXCLUDED.tipo;
            """.replace('\n', ' ').strip()
            imprimir_bloco_sql(sql_grade)

            # 3. Entrar na disciplina para pegar turmas/horários
            link_element.click()

            trs_t = driver.find_elements(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/div[1]/div/div[2]/div[3]/div[2]/table/tbody/tr')
            for tr_t in trs_t:
                prof = tr_t.find_element(By.XPATH, './/div[1]/div[5]/div[2]').text.strip().split("\n")[0] or "A DEFINIR"
                num_t = "".join(filter(str.isdigit, tr_t.find_element(By.XPATH, './/div[1]/div[1]/div').text)) or "0"
                vagas_txt = tr_t.find_element(By.XPATH, './/td/div/div[2]/table[1]/tbody/tr[2]/td[2]').text.strip()
                vagas = int(vagas_txt) if vagas_txt.isdigit() else 0

                imprimir_bloco_sql(f"INSERT INTO professor (nome) VALUES ({format_val(prof)}) ON CONFLICT (nome) DO NOTHING;".strip())

                sql_turma = f"INSERT INTO public.turma (codigo_disciplina, id_professor, numero, vagas) VALUES ({format_val(cod)}, (SELECT id FROM professor WHERE nome={format_val(prof)} LIMIT 1), {num_t}, {vagas}) ON CONFLICT (codigo_disciplina, numero) DO UPDATE SET id_professor=EXCLUDED.id_professor, vagas=EXCLUDED.vagas;".strip()
                imprimir_bloco_sql(sql_turma)

                divs_h = tr_t.find_elements(By.XPATH, './/div[1]/div[3]/div[2]/div')
                for h in range(0, len(divs_h), 2):
                    dia_site = divs_h[h].text.strip().upper()
                    tempos = divs_h[h+1].text.strip().split(" ")
                    for t in tempos:
                        if dia_site in mapa_dias and t in mapa_horarios:
                            sql_horario = f"""
                            INSERT INTO public.horario_aula (id_turma, dia, hora, codigo_hora) 
                            VALUES ((SELECT id_turma FROM public.turma WHERE codigo_disciplina={format_val(cod)} AND numero={num_t} LIMIT 1), CAST({format_val(mapa_dias[dia_site])} AS dia_semana_enum), CAST({format_val(mapa_horarios[t])} AS TIME), {format_val(t)}) 
                            ON CONFLICT (id_turma, dia, hora) DO UPDATE SET codigo_hora=EXCLUDED.codigo_hora;
                            """.replace('\n', ' ').strip()
                            imprimir_bloco_sql(sql_horario)

            # Voltar para a lista
            try:
                driver.find_element(By.XPATH, '/html/body/table/tbody/tr[2]/td/table/tbody/tr/td/a[1]').click()
            except:
                driver.find_element(By.XPATH, '/html/body/table/tbody/tr[3]/td/form/div[2]/button').click()
            
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.XPATH, linhas_xpath)))

        except Exception as e:
            print(f"ERRO na linha {i}: {e}")
            continue

    # Finalizar e voltar para a home
    driver.find_element(By.XPATH, '/html/body/table/tbody/tr[2]/td/table/tbody/tr/td/a[1]').click()