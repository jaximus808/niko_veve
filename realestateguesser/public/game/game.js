
const socket = io();

var localUsername 

var gameManager;

function GameManager(players, timer, round )
{
    this.players = players; 
    this.timer = timer;
    this.round = round; 

    this.playerDisplayEl = document.getElementById("playerDisplay")
    
    this.displayPlayers = (id, name, points)=>
    {
        console.log("MEOW")
        var playerDiv = document.createElement("div") 
        playerDiv.setAttribute("class","playerImg")
        var namePlayer = document.createElement("p");
        namePlayer.innerHTML = name; 
        var pointsDisplay = document.createElement("p");
        pointsDisplay.innerHTML = `Points: ${points}`; 

        playerDiv.setAttribute("id",id); 

        playerDiv.appendChild(namePlayer)

        playerDiv.appendChild(pointsDisplay)

        this.playerDisplayEl.appendChild(playerDiv);

    }
    for(const [key, value] of Object.entries(this.players))
    {
        this.displayPlayers(key, value.name, value.points);
    }



    this.addPlayer = (id, playerData) =>
    {
        this.players[id] = playerData 
        this.displayPlayers(id, playerData.name, playerData.points)
    }

    this.removePlayer = (id) =>
    {
        delete this.player[id] 
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

socket.on("connected", ()=>
{
    gameManager.addPlayer(socket.id,{
        name: localUsername,
        points: 0, 
    })
    
})

socket.on("returnHome", ()=>
{
    window.location.href ="/"
})

socket.on("InitGameInfo", (res) =>
{
    console.log("FARTSSS")
    var data = res
    console.log(data)
    gameManager = new GameManager(data.players, data.timer, data.round )
})

socket.on("playerJoin", (id, username) =>
{
    console.log(id)
    console.log(username)
    gameManager.addPlayer(id, {name:username,points: 0})
})

socket.on("disconnectPlayer", (id) =>
{
    gameManager.removePlayer(id); 
})

