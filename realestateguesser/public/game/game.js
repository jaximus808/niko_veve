
const socket = io();

var localUsername 

var currentGuessTime; 

var timerInteveralOb; 

var gameManager;

var imagePrompt = 0; 

let imageDisplayLens = 3; 

let imageIdDisplay = 0; 

let maxPlayers = 0; 


window.onload = (event) =>
{
    const msgInput = document.getElementById("inputMsg")

    const guessInput = document.getElementById("guessEstateInput")

    msgInput.addEventListener("keydown", function onEvent(event)
    {
        if(event.key == "Enter")
        {
            sendMsg();
        }
    })

    guessInput.addEventListener("keydown", function onEvent(event)
    {
        if(event.key == "Enter")
        {
            sendGuess();
        }
    })
    
} 


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


        playerDiv.setAttribute("id","player-"+id); 

        playerDiv.appendChild(namePlayer)

        playerDiv.appendChild(pointsDisplay)

        this.playerDisplayEl.appendChild(playerDiv);

    }

    this.DisplayRankPlayers = (winnerArray ) =>
    {
        document.getElementById("winNameDisplay").innerHTML = ""; 
        document.getElementById("rankings").innerHTML = ""; 

        const rankingPlayers = Object.keys(this.players);
        console.log("878t878t97")
        rankingPlayers.sort((a,b) =>
        {
            return  this.players[b].points - this.players[a].points 
        })
        console.log(rankingPlayers)
        console.log("MEW")
        console.log(winnerArray)
        console.log(winnerArray.length)
        let additionString = ""
        for(let i = 0; i < winnerArray.length; i++)
        {
            additionString +=`<h3>${this.players[winnerArray[i]].name}</h3><p>Points: ${this.players[winnerArray[i]].points}</p>`
        }

        console.log(additionString)
        console.log("dpgpdpgpf")
        document.getElementById("winNameDisplay").innerHTML = additionString;
        
        for(let i = 0; i < rankingPlayers.length; i++)
        {
            const displayPlayerLi = document.createElement("div");
            const displayPlayerDiv = document.createElement("div"); 
            const displayName = document.createElement("h3");
            displayName.innerHTML = `${i+1}. ${this.players[rankingPlayers[i]].name}`; 

            const displayPts = document.createElement("div");
            displayPts.innerHTML = this.players[rankingPlayers[i]].points;
            displayPlayerDiv.appendChild(displayName)
            displayPlayerDiv.appendChild(displayPts)
            displayPlayerLi.appendChild(displayPlayerDiv)
            document.getElementById("rankings").appendChild(displayPlayerLi)
        }
        document.getElementById("winContainer").display = "inline"
    }

    for(const [key, value] of Object.entries(this.players))
    {
        this.displayPlayers(key, value.name, value.points,value.admin);
    }

    this.updatePlayerPoints = (id, points) =>
    {
        players[id].points = points
        document.getElementById("points"+id).innerHTML = `Points: ${points}`
    }


    this.addPlayer = (id, playerData) =>
    {
        this.players[id] = playerData 
        this.displayPlayers(id, playerData.name, playerData.points,playerData.admin)

        document.getElementById("playerUpdateCount").innerHTML = `Players: (${Object.keys(this.players).length}/${maxPlayers})`
    }

    this.removePlayer = (id) =>
    {
        delete this.players[id] 
        document.getElementById("player-"+id).remove();

        document.getElementById("playerUpdateCount").innerHTML = `Players: (${Object.keys(this.players).length}/${maxPlayers})`
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

    socket.emit("joinGame", localUsername)
}

function realEstatePrompt(data) 
{
    //document.getElementById("estatePrompterContainer").display = "inline"
    
    
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

function UpdateTimeLimitAdmin()
{
    document.getElementById("timeLimitValueAdmin").innerHTML = document.getElementById("timeLimitRange").value
}

function UpdateMaxRoundsAdmin()
{
    document.getElementById("maxRoundValueAdmin").innerHTML = document.getElementById("maxRoundsInput").value
}

function changeSettings()
{
    timeLimitUpdate = document.getElementById("timeLimitRange").value; 
    maxRounds = document.getElementById("maxRoundsInput").value; 
    showLocation = document.getElementById("showLocationInput").checked; 
    socket.emit("changeSettings", {
        guessTime: timeLimitUpdate,
        maxRounds: maxRounds,
        showLocation: showLocation
    })
}


//do guess input logic 
function startGame()
{
    socket.emit("StartGame");
    document.getElementById("AdminPanel").style.display = "none"
    document.getElementById("winContainer").style.display = "none"
}

function startTimer(setTimer,guessing)
{
    clearInterval(timerInteveralOb)
    console.log(setTimer)
    currentGuessTime = setTimer + 1; 
    updateTime(guessing)
    timerInteveralOb = setInterval(()=>
    {
        updateTime(guessing)
    }, 1000)
    //do later
}

function updateTime(guessing)
{
    if(currentGuessTime == 0) return; 
    currentGuessTime -= 1; 
    document.getElementById("currentGuessTime").innerHTML = `${(guessing) ? 
    "Time to Guess:":"Next Round Starts in: "} ${currentGuessTime}`
}

function setImage(imgValue)
{
    if(imgValue >= imageDisplayLens || imgValue < 0) return; 
    document.getElementById(`promptImg${imageIdDisplay}`).style.display ="none"
    imageIdDisplay = imgValue
    document.getElementById(`promptImg${imageIdDisplay}`).style.display ="inline"
    console.log(imageIdDisplay)
    if(imageIdDisplay == 0 )
    {
        document.getElementById("leftImageSwap").disabled = true;
        document.getElementById("rightImageSwap").disabled = false;
    }
    else if(imageIdDisplay == imageDisplayLens-1)
    {
        document.getElementById("leftImageSwap").disabled = false;
        document.getElementById("rightImageSwap").disabled = true;
    }
    else 
    {

        document.getElementById("leftImageSwap").disabled = false;
        document.getElementById("rightImageSwap").disabled = false;
    }
}

function incrementImageLeft()
{
    setImage(imageIdDisplay-1)
}


function incrementImageRight()
{
    setImage(imageIdDisplay+1)
}

function sendGuess()
{
    let guessPrice = parseInt(document.getElementById("guessEstateInput").value.trim())

    if(isNaN(guessPrice)) return; 

    document.getElementById("guessEstateInput").value = "";
    socket.emit("guess",guessPrice)
    document.getElementById('guessArea').style.display = "none"; 

}



socket.on("playerRoundUpdateEnd", (data) =>
{
    for(let i = 0; i < Object.keys(data.players).length; i++)
    {
        let _playerId = Object.keys(data.players)[i]
        gameManager.updatePlayerPoints(_playerId, data.players[_playerId].points)
    }
    console.log(data)
    document.getElementById("priceAnswerContainer").style.display = "inline"
    document.getElementById("displayAnswerPriceID").innerHTML = `$${data.answer}`

    document.getElementById('guessArea').style.display = "none"; 
    startTimer(data.bufferTimer, false); 
})

socket.on("roundStart", (data) =>
{
    setImage(0)

    document.getElementById("winContainer").style.display = "none"
    for(let i = 0; i < data.images.length; i++)
    {
        document.getElementById(`promptImg${i}`).setAttribute("src", `/api/images/${data.images[i]}`); 
    }
    document.getElementById("promptDesc").innerHTML = data.description; 

    if(data.location != null)
    {
        document.getElementById("locationDisplay").innerHTML = data.location;
    }

    startTimer(data.guessTimer,true); 

    document.getElementById("roundNumDisplay").innerHTML = data.round

    document.getElementById("estatePrompterContainer").style.display = "inline"
    
    document.getElementById("stats").style.display = "none"; 

    document.getElementById("guessArea").style.display = "inline"
    document.getElementById("priceAnswerContainer").style.display = "none"
    document.getElementById("displayAnswerPriceID").innerHTML = ""
})

socket.on("resetPoints", ()=>
{
    for(let i = 0; i < Object.keys(gameManager.players).length; i++)
    {
        let _playerId = Object.keys(gameManager.players)[i]
        gameManager.updatePlayerPoints(_playerId,0)
    }
})

socket.on("chatMessage",(data) =>
{
    RenderMessageDOM(data)    
})

socket.on("fullLobbyConnect", ()=>
{
    document.getElementById("joinStatus").innerHTML = "Game is full! Try again later"; 
})

socket.on("connected", (admin)=>
{
    document.getElementById("usernamePrompt").style.display = "none"

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

    maxPlayers = res.maxPlayers

    gameManager = new GameManager(data.players, data.timer, data.round ) 

    document.getElementById("guessTimeDisplay").innerHTML = `Guess Time: ${data.settings.guessTime/1000}`

    document.getElementById("maxRoundsDisplay").innerHTML = `Maximum Rounds: ${data.settings.maxRounds}`

    document.getElementById("showLocationDisplay").innerHTML = `Show Location: ${(data.settings.showLocation) ? "True": "False"}`

    document.getElementById("timeLimitValueAdmin").innerHTML = data.settings.guessTime/1000
    document.getElementById("timeLimitRange").value = data.settings.guessTime/1000
    document.getElementById("maxRoundValueAdmin").innerHTML = data.settings.maxRounds
    document.getElementById("maxRoundsInput").value = data.settings.maxRounds
    console.log(document.getElementById("showLocationInput").value)
    document.getElementById("showLocationInput").checked = data.settings.showLocation
    document.getElementById("promptLocationContainer").display = (data.settings.showLocation) ? "inline":"none"
    document.getElementById("gameState").innerHTML = `${(data.gameState == 0 ) ? "Waiting for game to start" : "In-Game"}`


    document.getElementById("playerUpdateCount").innerHTML = `Players: (${Object.keys(gameManager.players).length}/${maxPlayers})`
})

socket.on("playerJoin", (id, username, admin,settings) =>
{
    gameManager.addPlayer(id, {name:username,points: 0, admin:admin})

    document.getElementById("timeLimitValueAdmin").innerHTML = `${settings.guessTime/1000}s`;
    document.getElementById("timeLimitRange").value = timeLimitRange; 

})


socket.on("gameEnd", (winnerOb)=>
{
    document.getElementById("estatePrompterContainer").style.display = "none"; 
    gameManager.DisplayRankPlayers(winnerOb.winners); 
    document.getElementById("winContainer").style.display = "inline"; 

    document.getElementById("stats").style.display = "inline"; 

    
})

socket.on("showAdminPanel", ()=>
{

    document.getElementById("AdminPanel").style.display = "inline";
})


socket.on("disconnectPlayer", (id) =>
{
    gameManager.removePlayer(id); 

})

socket.on("settingUpdate", (settings) =>
{
    document.getElementById("guessTimeDisplay").innerHTML = `Guess Time: ${settings.guessTime/1000}`

    document.getElementById("maxRoundsDisplay").innerHTML = `Maximum Rounds: ${settings.maxRounds}`


    document.getElementById("promptLocationContainer").display = (settings.showLocation) ? "inline":"none"
    document.getElementById("showLocationDisplay").innerHTML = `Show Location: ${(settings.showLocation) ? "True": "False"}`
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