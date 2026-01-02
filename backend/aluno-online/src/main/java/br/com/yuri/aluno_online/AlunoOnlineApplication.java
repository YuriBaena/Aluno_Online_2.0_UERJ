package br.com.yuri.aluno_online;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class AlunoOnlineApplication {

	public static void main(String[] args) {
		SpringApplication.run(AlunoOnlineApplication.class, args);
	}

}
