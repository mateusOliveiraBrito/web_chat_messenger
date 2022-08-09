﻿//Conexão e reconexão com o Hub do SignalR
var connection = new signalR.HubConnectionBuilder().withUrl("https://localhost:5001/ChatMessengerHub").build();

connectionStart();

function connectionStart() {
    connection.start().then(function () {
        habilitarCadastro();
        habilitarLogin();

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
        var btnAcessar = document.getElementById("btnAcessar").addEventListener("click", function () {
            var email = document.getElementById("email").value;
            var senha = document.getElementById("senha").value;

            var usuario = { Email: email, Senha: senha };

            connection.invoke("RealizarLogin", usuario);
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

function GetUsuarioLogado() {
    return JSON.parse(sessionStorage.getItem("Logado"));
}

function SetUsuarioLogado(usuarioLogado) {
    sessionStorage.setItem("Logado", JSON.stringify(usuarioLogado));
}