// src/components/LoginForm/LoginForm.jsx
import React, { useState } from "react";
import { Box, Button, TextField, Typography, Stack, Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import api from "../../services/api";
import {
  validarEmail,
  obrigatorio,
  validarFormulario,
} from "../../utils/validacoes";

const REGRAS = {
  email: validarEmail,
  senha: (valor) => obrigatorio(valor, "Senha"),
};

export default function LoginForm({ onClose, closeModal }) {
  const [valores, setValores] = useState({ email: "", senha: "" });
  const [erros, setErros] = useState({});
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);


  const fechar = () => {
    if (typeof onClose === "function") onClose();
    if (typeof closeModal === "function") closeModal();
  };

  const alterar = (campo) => (evento) => {
    setValores((atual) => ({ ...atual, [campo]: evento.target.value }));
    setErros((atual) => ({ ...atual, [campo]: null }));
    setErro("");
  };

  const validarCampo = (campo) => () => {
    setErros((atual) => ({
      ...atual,
      [campo]: REGRAS[campo](valores[campo], valores),
    }));
  };

  const handleLogin = async () => {
    const { erros: novosErros, valido } = validarFormulario(valores, REGRAS);
    setErros(novosErros);
    if (!valido) return;

    setEntrando(true);
    setErro("");

    try {
      const response = await api.post("/api/usuarios/login", {
        email: valores.email.trim().toLowerCase(),
        senha: valores.senha,
      });

      if (response.data && response.data.user) {
        const userData = {
          _id: response.data.user.id,
          name: response.data.user.nome,
          email: response.data.user.email,
          phone: response.data.user.telefone || "",
          avatar: response.data.user.avatar || "",
          logado: true,
          token: response.data.token,
          favorites: response.data.user.favoritos || [],
          socialMedia: response.data.user.redeSocial || {},
          address: response.data.user.endereco || {},
          about: response.data.user.sobre || "",
        };

        localStorage.setItem("user", JSON.stringify(userData));
        window.dispatchEvent(new Event("userLoggedIn"));
        fechar();
        window.location.href = "/";
      } else {
        setErro("Credenciais inválidas");
      }
    } catch (err) {
      setErro(err.response?.data?.message || "Erro ao tentar fazer login");
    } finally {
      setEntrando(false);
    }
  };

  const aoEnviar = (evento) => {
    evento.preventDefault();
    handleLogin();
  };

  return (
    <Box component="form" onSubmit={aoEnviar} noValidate>
      <Typography id="modal-login" variant="h5" textAlign="center" mb={2}>
        Entrar
      </Typography>

      <Stack spacing={2}>
        <TextField
          label="E-mail"
          type="email"
          required
          fullWidth
          value={valores.email}
          onChange={alterar("email")}
          onBlur={validarCampo("email")}
          error={Boolean(erros.email)}
          helperText={erros.email || " "}
        />

        <TextField
          label="Senha"
          type="password"
          required
          fullWidth
          value={valores.senha}
          onChange={alterar("senha")}
          onBlur={validarCampo("senha")}
          error={Boolean(erros.senha)}
          helperText={erros.senha || " "}
        />

        {erro && (
          <Typography color="error" textAlign="center">
            {erro}
          </Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={entrando}
          sx={{ mt: 1 }}
        >
          {entrando ? "Entrando..." : "Entrar"}
        </Button>

        <Typography variant="body2" textAlign="center">
          Não tem uma conta?{" "}
          <Link
            component={RouterLink}
            to="/cadastro-usuario"
            onClick={fechar}
            sx={{
              cursor: "pointer",
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Cadastre-se!
          </Link>
        </Typography>
      </Stack>
    </Box>
  );
}