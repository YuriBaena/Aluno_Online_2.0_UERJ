package br.com.yuri.aluno_online.infrastructure;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("")
public class AlunoResource {
    
    @GetMapping("hello")
    public String mandaOi(){
        return "Hello";
    }

}
