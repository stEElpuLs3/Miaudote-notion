// src/utils/validacoes.js
// Cada função devolve null quando está tudo certo,
// ou uma string com a mensagem de erro.

export function obrigatorio(valor, nomeDoCampo = 'Este campo') {
    if (valor === null || valor === undefined) return `${nomeDoCampo} é obrigatório`;
    if (typeof valor === 'string' && valor.trim() === '') return `${nomeDoCampo} é obrigatório`;
    return null;
}

export function somenteNumeros(valor) {
    return String(valor || '').replace(/\D/g, '');
}

// --- Usuário ---

export function validarNome(valor) {
    const vazio = obrigatorio(valor, 'Nome');
    if (vazio) return vazio;
    const limpo = valor.trim();
    if (limpo.length < 3) return 'Nome precisa ter ao menos 3 letras';
    if (limpo.length > 80) return 'Nome muito longo';
    if (!/^[A-Za-zÀ-ÿ\s'.-]+$/.test(limpo)) return 'Nome não pode conter números';
    return null;
}

export function validarEmail(valor) {
    const vazio = obrigatorio(valor, 'E-mail');
    if (vazio) return vazio;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim())) return 'E-mail inválido';
    return null;
}

export function validarSenha(valor) {
    const vazio = obrigatorio(valor, 'Senha');
    if (vazio) return vazio;
    if (valor.length < 6) return 'Senha precisa ter ao menos 6 caracteres';
    return null;
}

export function validarConfirmacaoSenha(confirmacao, todosOsValores = {}) {
    const vazio = obrigatorio(confirmacao, 'Confirmação de senha');
    if (vazio) return vazio;
    if (confirmacao !== todosOsValores.senha) return 'As senhas não conferem';
    return null;
}

export function validarTelefone(valor, { exigir = true } = {}) {
    const digitos = somenteNumeros(valor);
    if (!digitos) return exigir ? 'Telefone é obrigatório' : null;
    if (digitos.length !== 10 && digitos.length !== 11) {
        return 'Telefone precisa ter DDD + número';
    }
    if (digitos.length === 11 && digitos[2] !== '9') {
        return 'Celular deve começar com 9 depois do DDD';
    }
    return null;
}

export function validarCep(valor, { exigir = false } = {}) {
    const digitos = somenteNumeros(valor);
    if (!digitos) return exigir ? 'CEP é obrigatório' : null;
    if (digitos.length !== 8) return 'CEP precisa ter 8 dígitos';
    return null;
}

// --- Pet ---

export function validarIdade(valor) {
    const vazio = obrigatorio(valor, 'Idade');
    if (vazio) return vazio;
    const numero = Number(valor);
    if (Number.isNaN(numero)) return 'Idade precisa ser um número';
    if (numero < 0) return 'Idade não pode ser negativa';
    if (numero > 30) return 'Confira a idade informada';
    return null;
}

export function validarTexto(valor, { nome = 'Campo', minimo = 0, maximo = 500 } = {}) {
    const vazio = obrigatorio(valor, nome);
    if (vazio) return vazio;
    const limpo = valor.trim();
    if (limpo.length < minimo) return `${nome} precisa ter ao menos ${minimo} caracteres`;
    if (limpo.length > maximo) return `${nome} pode ter no máximo ${maximo} caracteres`;
    return null;
}

// --- Máscaras: use no onChange para formatar enquanto a pessoa digita ---

export function mascaraTelefone(valor) {
    const d = somenteNumeros(valor).slice(0, 11);
    if (d.length <= 10) {
        return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    }
    return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

export function mascaraCep(valor) {
    return somenteNumeros(valor).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
}

// --- Roda várias validações de uma vez ---
// regras = { nome: validarNome, email: validarEmail }
export function validarFormulario(valores, regras) {
    const erros = {};
    Object.keys(regras).forEach((campo) => {
        const erro = regras[campo](valores[campo], valores);
        if (erro) erros[campo] = erro;
    });
    return { erros, valido: Object.keys(erros).length === 0 };
}