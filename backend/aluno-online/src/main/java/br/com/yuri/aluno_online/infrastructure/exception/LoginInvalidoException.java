package br.com.yuri.aluno_online.infrastructure.exception;

public class LoginInvalidoException extends AlunoOnlineException {
    public LoginInvalidoException() {
        super("Matrícula ou senha incorretos no Portal Aluno Online.");
    }
}