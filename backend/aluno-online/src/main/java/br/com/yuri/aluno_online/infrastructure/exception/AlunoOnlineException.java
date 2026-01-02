package br.com.yuri.aluno_online.infrastructure.exception;

public abstract class AlunoOnlineException extends RuntimeException {
    public AlunoOnlineException(String message) {
        super(message);
    }
}