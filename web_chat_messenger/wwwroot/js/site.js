﻿//Conexão e reconexão com o Hub do SignalR
var connection = new signalR.HubConnectionBuilder().withUrl("https://localhost:5001/ChatMessengerHub").build();

connectionStart();

function connectionStart() {
    connection.start().then(function () {
        habilitarCadastro();
        habilitarLogin();
        habilitarConversacao();

        console.info("SignalR conectado!");
    }).catch(function (erro) {
        console.info("Erro ao conectar com o SignalR: " + erro.toString());
        setTimeout(connectionStart(), 5000);
    });
}

connection.onclose(async () => {
    await connectionStart();
});

//Página de cadastro
function habilitarCadastro() {
    var formCadastro = document.getElementById("formCadastro");

    if (formCadastro != null) {
        var btnCadastrar = document.getElementById("btnCadastrar");
        btnCadastrar.addEventListener("click", function () {

            var nome = document.getElementById("nome").value;
            var email = document.getElementById("email").value;
            var senha = document.getElementById("senha").value;

            var usuario = {
                Nome: nome,
                Email: email,
                Senha: senha
            };

            connection.invoke("CadastrarUsuario", usuario);
        });
    }

    connection.on("ConfirmarCadastro", function (sucesso, usuario, msg) {
        var mensagem = document.getElementById("campo-mensagem");
        mensagem.innerText = msg;

        if (sucesso) {
            console.info(usuario);
            limparFormularioDeCadastro();
        }
    });
}

function limparFormularioDeCadastro() {
    var nome = document.getElementById("nome").value = "";
    var email = document.getElementById("email").value = "";
    var senha = document.getElementById("senha").value = "";
}

//Página de login
function habilitarLogin() {
    var formLogin = document.getElementById("formLogin");

    if (formLogin != null) {

        var sessaoUsuarioLogado = GetUsuarioLogado();
        if (sessaoUsuarioLogado != null) {
            window.location.href = "/Home/Conversacao";
        }

        document.getElementById("btnAcessar").addEventListener("click", function () {
            var email = document.getElementById("email").value;
            var senha = document.getElementById("senha").value;

            var usuario = { Email: email, Senha: senha };

            connection.invoke("RealizarLogin", usuario);
        });

        document.getElementById("btnCadastrar").addEventListener("click", function () {
            window.location.href = "/Home/Cadastro";
        });
    }

    connection.on("ConfirmarLogin", function (sucesso, usuarioLogado, msg) {

        if (sucesso) {
            SetUsuarioLogado(usuarioLogado);
            window.location.href = "/Home/Conversacao";
        } else {
            var mensagem = document.getElementById("mensagem");
            mensagem.innerText = msg;
        }
    });
}

//Página de conversação
function habilitarConversacao() {
    var telaConversacao = document.getElementById("paginaConversacao");

    if (telaConversacao != null) {
        gerenciarConnectionIds();
        gerenciarListaDeUsuarios();
    }
}

function gerenciarConnectionIds() {
    var usuarioLogado = GetUsuarioLogado();
    if (usuarioLogado == null) {
        window.location.href = "/Home/Login";
    }

    connection.invoke("AdicionarConnectionIdDoUsuario", GetUsuarioLogado());

    var btnSair = document.getElementById("btnSair");
    btnSair.addEventListener("click", function () {
        connection.invoke("RemoverConnectionIdDoUsuario", GetUsuarioLogado()).then(function () {
            DeleteUsuarioLogado();
            window.location.href = "/Home/Login";
        });
    });
}

function gerenciarListaDeUsuarios() {
    connection.invoke("ObterListaDeUsuarios");
}

//Funções globais
function GetUsuarioLogado() {
    return JSON.parse(sessionStorage.getItem("Logado"));
}

function SetUsuarioLogado(usuarioLogado) {
    sessionStorage.setItem("Logado", JSON.stringify(usuarioLogado));
}

function DeleteUsuarioLogado() {
    sessionStorage.removeItem("Logado");
}