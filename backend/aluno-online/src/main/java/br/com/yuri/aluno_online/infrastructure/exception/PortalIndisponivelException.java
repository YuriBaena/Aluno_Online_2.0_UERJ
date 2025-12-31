package br.com.yuri.aluno_online.infrastructure.exception;

public class PortalIndisponivelException extends AlunoOnlineException {
    public PortalIndisponivelException() {
        super("O Portal Aluno Online da UERJ está indisponível ou fora do ar no momento.");
    }
}