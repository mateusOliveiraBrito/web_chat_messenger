//Conexão e reconexão com o Hub do SignalR
var connection = new signalR.HubConnectionBuilder().withUrl("https://localhost:5001/ChatMessengerHub").build();
var nomeGrupo = "";

connectionStart();

function connectionStart() {
    connection.start().then(function () {
        habilitarCadastro();
        habilitarLogin();
        habilitarConversacao();

        console.info("SignalR conectado!");
    }).catch(function (erro) {

        if (connection.state == 0) {
            console.info("Erro ao conectar com o SignalR: " + erro.toString());
            setTimeout(connectionStart, 5000);
        }
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
        enviarEReceberMensagem();
        abrirGrupo();
        OfflineObserver();
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
        connection.invoke("RealizarLogout", GetUsuarioLogado()).then(function () {
            DeleteUsuarioLogado();
            window.location.href = "/Home/Login";
        });
    });
}

function gerenciarListaDeUsuarios() {
    connection.invoke("ObterListaDeUsuarios");

    connection.on("ReceberListaDeUsuarios", function (usuarios) {
        var html = "";

        for (i = 0; i < usuarios.length; i++) {
            if (GetUsuarioLogado().id != usuarios[i].id) {
                html += '<div class="container-user-item"><img src="/imagem/logo.png" style="width:20%;" /><div><span>' + usuarios[i].nome.split(" ")[0] + ' ' + (usuarios[i].nome.split(" ")[1] == null ? ' ' : usuarios[i].nome.split(" ")[1]) + '</span><br/>' + '<span>' + (usuarios[i].isOnline ? 'Online' : 'Offline') + '</span><br/><span class="email">' + usuarios[i].email + '</span></div></div>';
            }
        }

        document.getElementById("users").innerHTML = html;

        var containerUsuarios = document.getElementById("users").querySelectorAll(".container-user-item");
        for (i = 0; i < containerUsuarios.length; i++) {
            containerUsuarios[i].addEventListener("click", function (event) {

                var componente = event.target || event.srcElement;

                var emailUsuarioLogado = GetUsuarioLogado().email;
                var emailUsuarioSelecionado = componente.parentElement.querySelector(".email").innerText;

                connection.invoke("CriarOuAbrirGrupo", emailUsuarioLogado, emailUsuarioSelecionado);
            });
        }
    });
}

function enviarEReceberMensagem() {
    document.getElementById("btnEnviar").addEventListener("click", function () {

        var mensagem = document.getElementById("mensagem").value;

        var usuarioLogado = GetUsuarioLogado();
        connection.invoke("EnviarMensagem", usuarioLogado, mensagem, nomeGrupo);

        document.getElementById("mensagem").value = "";
    });

    connection.on("ReceberMensagem", function (mensagem, nomeDoGrupo) {
        if (nomeGrupo == nomeDoGrupo) {
            var containerMensagem = document.querySelector(".container-messages");
            var htmlMensagem = '<div class="message message-' + (GetUsuarioLogado().id == mensagem.usuario.id ? 'right' : 'left') + '"><div class="message-head"><img src="/imagem/chat.png" /> ' + mensagem.usuario.nome + '</div><div class="message-message">' + mensagem.texto + '</div></div>';
            containerMensagem.innerHTML += htmlMensagem;
        }
    });
}

function abrirGrupo() {
    connection.on("AbrirGrupo", function (nomeDoGrupo, mensagens) {
        nomeGrupo = nomeDoGrupo;
        var containerMensagem = document.querySelector(".container-messages");
        containerMensagem.innerHTML = "";

        if (nomeGrupo == nomeDoGrupo) {
            var htmlMensagem = "";
            for (i = 0; i < mensagens.length; i++) {
                htmlMensagem += '<div class="message message-' + (GetUsuarioLogado().id == mensagens[i].usuario.id ? 'right' : 'left') + '"><div class="message-head"><img src="/imagem/chat.png" /> ' + mensagens[i].usuario.nome + '</div><div class="message-message">' + mensagens[i].texto + '</div></div>';
            }

            containerMensagem.innerHTML += htmlMensagem;
        }

        document.querySelector(".container-button").style.display = "flex";
    });
}

function OfflineObserver() {
    window.addEventListener("beforeunload", function (event) {
        connection.invoke("RemoverConnectionIdDoUsuario", GetUsuarioLogado());
        event.returnValue = "Sua sessão será encerrada. Deseja sair mesmo assim?";
    });
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