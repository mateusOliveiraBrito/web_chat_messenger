//Conexão e reconexão com o Hub do SignalR
var connection = new signalR.HubConnectionBuilder().withUrl("https://localhost:5001/ChatMessengerHub").build();

connectionStart();

function connectionStart() {
    connection.start().then(function () {
        console.info("SignalR conectado!");
    }).catch(function (erro) {
        console.info("Erro ao conectar com o SignalR: " + erro.toString());
        setTimeout(connectionStart(), 5000);
    });
}

connection.onclose(async () => {
    await connectionStart();
});