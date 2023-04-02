
const socket = io();

var localUsername 

var gameManager;


const msgInput = document.getElementById("inputMsg")

msgInput.addEventListener("keydown", function onEvent(event)
{
    if(event.key == "Enter")
    {
        sendMsg();
    }
})

function sendMsg()
{
    let msg = document.getElementById("inputMsg").value; 
    if(msg.trim().length == 0) return;
    document.getElementById("inputMsg").value = ''
    socket.emit("chatMsg",msg);
}


document.getElementById("joinCode").innerHTML = `Send this room code to friends! <span class="linksDisplay" >${window.location.href.split('/')[window.location.href.split('/').length-2]}</span>`

document.getElementById("inviteLink").innerHTML = `Invite Link: ${window.location.href}`

function GameManager(players, timer, round )
{
    this.players = players; 
    this.timer = timer;
    this.round = round; 

    this.playerDisplayEl = document.getElementById("playerDisplay")
    
    this.displayPlayers = (id, name, points, admin)=>
    {
        console.log(admin)
        console.log("MEOW")
        var playerDiv = document.createElement("div") 
        playerDiv.setAttribute("class","playerImg")
        var namePlayer = document.createElement("p");
        namePlayer.innerHTML = `${name} ${(admin) ? " (admin)":""}`; 
        namePlayer.setAttribute("id", `name${id}`)
        var pointsDisplay = document.createElement("p");
        pointsDisplay.innerHTML = `Points: ${points}`; 
        pointsDisplay.setAttribute("id",`points${id}`)


        playerDiv.setAttribute("id",id); 

        playerDiv.appendChild(namePlayer)

        playerDiv.appendChild(pointsDisplay)

        this.playerDisplayEl.appendChild(playerDiv);

    }
    for(const [key, value] of Object.entries(this.players))
    {
        this.displayPlayers(key, value.name, value.points,value.admin);
    }



    this.addPlayer = (id, playerData) =>
    {
        this.players[id] = playerData 
        this.displayPlayers(id, playerData.name, playerData.points,playerData.admin)
    }

    this.removePlayer = (id) =>
    {
        delete this.players[id] 
        document.getElementById(id).remove();
    }



}

function joinGame()
{
    localUsername= document.getElementById("usernameInput").value; 

    if(!localUsername || localUsername.replace(/\s/g, '') == '')
    {
        document.getElementById("joinStatus").innerHTML = "Please add a username"
        return; 
    }

    document.getElementById("usernamePrompt").style.display = "none"
    socket.emit("joinGame", localUsername)
}

function RenderMessageDOM(data)
{
    console.log(data)
    var chatContainer = document.getElementById("chatContianer");
    var chatP = document.createElement("p");
    if(data.server)
    {
        chatP.setAttribute("class","serverMessage"); 
    }
    else
    {
        chatP.setAttribute("class","message"); 
    }
    chatP.innerHTML = `${data.user} ${(data.admin) ? "(admin)":""}: ${data.msg}`;
    chatContainer.prepend(chatP);
}

socket.on("chatMessage",(data) =>
{
    console.log(data)
    if(data.server)
    {
        return; 
    }
    RenderMessageDOM(data)

    
    
})

socket.on("connected", (admin)=>
{
    if(admin) document.getElementById("AdminPanel").style.display = "inline"
    gameManager.addPlayer(socket.id,{
        name: localUsername,
        points: 0,
        admin:admin 
    })
})

socket.on("returnHome", ()=>
{
    window.location.href ="/"
})

socket.on("InitGameInfo", (res) =>
{
    var data = res
    console.log(data)
    gameManager = new GameManager(data.players, data.timer, data.round )
    document.getElementById("gameState").innerHTML = `${(data.gameState == 0 ) ? "Waiting for game to start" : "In-Game"}`
})

socket.on("playerJoin", (id, username, admin) =>
{
    console.log(id)
    console.log(admin)
    gameManager.addPlayer(id, {name:username,points: 0, admin:admin})
})

socket.on("disconnectPlayer", (id) =>
{
    gameManager.removePlayer(id); 
})

socket.on("adminUpdate", (updateId)=>{
    //can prob do better
    console.log(`name${updateId}`)
    document.getElementById(`name${updateId}`).innerHTML =document.getElementById(`name${updateId}`).innerHTML+ " (admin)"
    if(gameManager.players[updateId].username == localUsername) 
    {
        document.getElementById("AdminPanel").style.display == "inline"
    }
})