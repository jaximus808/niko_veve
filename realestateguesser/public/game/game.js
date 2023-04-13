//creates the connection websocket
const socket = io();

var localUsername 

var currentGuessTime; 

var timerInteveralOb; 

var gameManager;

var imagePrompt = 0; 

let imageDisplayLens = 3; 

let imageIdDisplay = 0; 

let maxPlayers = 0; 

//creates event listeners after everything loads

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
    //gets the value of the message input
    let msg = document.getElementById("inputMsg").value; 
    //checks to make sure there is a message 
    if(msg.trim().length == 0) return;
    document.getElementById("inputMsg").value = ''
    //sends the message
    socket.emit("chatMsg",msg);
}

//display the link code dynamically
document.getElementById("joinCode").innerHTML = `Send this room code to friends! <span class="linksDisplay" >${window.location.href.split('/')[window.location.href.split('/').length-2]}</span>`

document.getElementById("inviteLink").innerHTML = `Invite Link: ${window.location.href}`

//Game Manager logic to handle players in the client and be able to display players and game stats on the client. 
function GameManager(players, timer, round )
{
    this.players = players; 
    this.timer = timer;
    this.round = round; 

    this.playerDisplayEl = document.getElementById("playerDisplay")
    

    //creates a player block in the client
    this.displayPlayers = (id, name, points, admin)=>
    {
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

    //rank the players and display it 
    this.DisplayRankPlayers = (winnerArray ) =>
    {
        document.getElementById("winNameDisplay").innerHTML = ""; 
        document.getElementById("rankings").innerHTML = ""; 

        const rankingPlayers = Object.keys(this.players);
        
        rankingPlayers.sort((a,b) =>
        {
            return  this.players[b].points - this.players[a].points 
        })
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

    //initially display the players 

    for(const [key, value] of Object.entries(this.players))
    {
        this.displayPlayers(key, value.name, value.points,value.admin);
    }

    //change the points on the players on the client
    this.updatePlayerPoints = (id, points) =>
    {
        players[id].points = points
        document.getElementById("points"+id).innerHTML = `Points: ${points}`
    }

    //add a new player joining 
    this.addPlayer = (id, playerData) =>
    {
        this.players[id] = playerData 
        this.displayPlayers(id, playerData.name, playerData.points,playerData.admin)

        document.getElementById("playerUpdateCount").innerHTML = `Players: (${Object.keys(this.players).length}/${maxPlayers})`
    }

    //get rid of a player when the leave from the client
    this.removePlayer = (id) =>
    {
        delete this.players[id] 
        document.getElementById("player-"+id).remove();

        document.getElementById("playerUpdateCount").innerHTML = `Players: (${Object.keys(this.players).length}/${maxPlayers})`
    }
}

//send a message to the server with the username 
function joinGame()
{
    //get name in input
    localUsername= document.getElementById("usernameInput").value; 

    if(!localUsername || localUsername.replace(/\s/g, '') == '')
    {
        document.getElementById("joinStatus").innerHTML = "Please add a username"
        return; 
    }

    //send to the server with the uername
    socket.emit("joinGame", localUsername)
}

//when a message is recieved from the server display it in the chat box 
function RenderMessageDOM(data)
{
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

//these two functions are for updating the value of the text
function UpdateTimeLimitAdmin()
{
    document.getElementById("timeLimitValueAdmin").innerHTML = document.getElementById("timeLimitRange").value
}

function UpdateMaxRoundsAdmin()
{
    document.getElementById("maxRoundValueAdmin").innerHTML = document.getElementById("maxRoundsInput").value
}

//when the admin changes settings and click chnage settings the values are uploaded to the server
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

//simply just sends a start game message to the server
function startGame()
{
    socket.emit("StartGame");
    document.getElementById("AdminPanel").style.display = "none"
    document.getElementById("winContainer").style.display = "none"
}

//used for counting down the timer in the display 
function startTimer(setTimer,guessing)
{
    //make sure there no already made interval 
    clearInterval(timerInteveralOb)
    currentGuessTime = setTimer + 1; 
    //counts down the timer
    updateTime(guessing)
    //each second uppdate the time to go down
    timerInteveralOb = setInterval(()=>
    {
        updateTime(guessing)
    }, 1000)
}

//decreass the time by one and displays it in the DOM 
function updateTime(guessing)
{
    if(currentGuessTime == 0) return; 
    currentGuessTime -= 1; 
    document.getElementById("currentGuessTime").innerHTML = `${(guessing) ? 
    "Time to Guess:":"Next Round Starts in: "} ${currentGuessTime}`
}

//this is used to cycle between the image displays allowing the players to see the other images
//the image value is used to say which image the user is looking at, this is also used to disable the button if there is no button for the image to switch to
function setImage(imgValue)
{
    if(imgValue >= imageDisplayLens || imgValue < 0) return; 
    //hides the current displayed image 
    document.getElementById(`promptImg${imageIdDisplay}`).style.display ="none"
    imageIdDisplay = imgValue

    //then show the new displayed image
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

//move the image left 
function incrementImageLeft()
{
    setImage(imageIdDisplay-1)
}

//move the image right 
function incrementImageRight()
{
    setImage(imageIdDisplay+1)
}

//get the value that they entered and send that to the server 
function sendGuess()
{
    let guessPrice = parseInt(document.getElementById("guessEstateInput").value.trim())

    if(isNaN(guessPrice)) return; 

    document.getElementById("guessEstateInput").value = "";
    socket.emit("guess",guessPrice)
    document.getElementById('guessArea').style.display = "none"; 

}


//after each round update the points of each player using the data from the server 
//it also displays the actual value of the home 
socket.on("playerRoundUpdateEnd", (data) =>
{
    //do this

    //have the server also send the points

    document.getElementById("midRoundRankings").innerHTML = ""; 

    const rankingPlayers = Object.keys(data.players);
        
    rankingPlayers.sort((a,b) =>
    {
        return  Math.abs(data.players[a].guess - data.answer) - Math.abs(data.players[b].guess - data.answer)
    })

    for(let i = 0; i < rankingPlayers.length; i++)
    {
        const displayPlayerLi = document.createElement("div");
        const displayPlayerDiv = document.createElement("div"); 
        const displayName = document.createElement("h3");
        displayName.innerHTML = `${i+1}. ${data.players[rankingPlayers[i]].name}`; 

        const displayPts = document.createElement("div");
        displayPts.innerHTML = (data.players[rankingPlayers[i]].guess > 0) ? data.players[rankingPlayers[i]].guess : 0;
        displayPlayerDiv.appendChild(displayName)
        displayPlayerDiv.appendChild(displayPts)
        displayPlayerLi.appendChild(displayPlayerDiv)
        document.getElementById("midRoundRankings").appendChild(displayPlayerLi)   
    }

    document.getElementById("correctPriceDisplay").innerHTML = `$${data.answer}`

    document.getElementById("estatePrompterContainer").style.display = "none"
    document.getElementById("midRoundGuessDisplay").style.display = "inline"

    for(let i = 0; i < Object.keys(data.players).length; i++)
    {
        let _playerId = Object.keys(data.players)[i]
        gameManager.updatePlayerPoints(_playerId, data.players[_playerId].points)
    }
    document.getElementById("priceAnswerContainer").style.display = "inline"
    document.getElementById("displayAnswerPriceID").innerHTML = `$${data.answer}`

    document.getElementById('guessArea').style.display = "none"; 
    startTimer(data.bufferTimer, false); 
})

//runs each round when it starts
socket.on("roundStart", (data) =>
{
    //sets the image to the first image 
    setImage(0)

    //hide the win display 
    document.getElementById("winContainer").style.display = "none"


    document.getElementById("midRoundGuessDisplay").style.display = "none"

    //updates the new images
    for(let i = 0; i < data.images.length; i++)
    {
        document.getElementById(`promptImg${i}`).setAttribute("src", `/api/images/${data.images[i]}`); 
    }
    //updates the data and desc of the real estate
    document.getElementById("promptDesc").innerHTML = data.description; 

    if(data.location != null)
    {
        document.getElementById("locationDisplay").innerHTML = data.location;
    }

    //starts the new timer for long the player can guess. The client does NOT do the "how long can guess" timer logic, it just displays the timer. 
    startTimer(data.guessTimer,true); 

    //hide and display the parts of the web page that needs to tbe seen. 
    document.getElementById("roundNumDisplay").innerHTML = data.round

    document.getElementById("estatePrompterContainer").style.display = "inline"
    
    document.getElementById("stats").style.display = "none"; 

    document.getElementById("guessArea").style.display = "inline"
    document.getElementById("priceAnswerContainer").style.display = "none"
    document.getElementById("displayAnswerPriceID").innerHTML = ""
})

//makes each point to zero when the server says so, used for just cleaning up stuff. 
socket.on("resetPoints", ()=>
{
    for(let i = 0; i < Object.keys(gameManager.players).length; i++)
    {
        let _playerId = Object.keys(gameManager.players)[i]
        gameManager.updatePlayerPoints(_playerId,0)
    }
})

//listening for the server to update a new message 
socket.on("chatMessage",(data) =>
{
    RenderMessageDOM(data)    
})

//if you try to join and the lobby is full it'll tell you 
socket.on("fullLobbyConnect", ()=>
{
    document.getElementById("joinStatus").innerHTML = "Game is full! Try again later"; 
})

//if ur successfully connected add urself to the client interpetation of the game, the server will also tell you if you are admin or not to display admin controls
socket.on("connected", (admin)=>
{
    document.getElementById("usernamePrompt").style.display = "none"

    document.getElementById("loadingInDisplay").style.display = "none"

    if(admin) document.getElementById("AdminPanel").style.display = "inline"
    
})

//if the room no exsit go back to the home page 
socket.on("returnHome", ()=>
{
    window.location.href ="/"
})

//when you first join the server must tell you what is happening in the server (which is where the real game happens), the client needs to interpet this and the server will first tell you what and who is in the server and what is initally happening
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

//if a player joins add them to the client's game Manager and display it
socket.on("playerJoin", (id, username, admin,settings) =>
{
    gameManager.addPlayer(id, {name:username,points: 0, admin:admin})

    document.getElementById("timeLimitValueAdmin").innerHTML = `${settings.guessTime/1000}s`;
    document.getElementById("timeLimitRange").value = timeLimitRange; 

})

//when the game ends display everything that neesd to be shown in the end screen
socket.on("gameEnd", (winnerOb)=>
{
    document.getElementById("estatePrompterContainer").style.display = "none"; 
    gameManager.DisplayRankPlayers(winnerOb.winners); 
    document.getElementById("winContainer").style.display = "inline"; 

    document.getElementById("stats").style.display = "inline"; 
})

//display admin panel if the user is an admin 
socket.on("showAdminPanel", ()=>
{

    document.getElementById("AdminPanel").style.display = "inline";
})

//if the server tells you antoher clietn left remove them from the client interpetation of the game 
socket.on("disconnectPlayer", (id) =>
{
    gameManager.removePlayer(id); 

})

//if the admin updates the settings of the game render those new settings 
socket.on("settingUpdate", (settings) =>
{
    document.getElementById("guessTimeDisplay").innerHTML = `Guess Time: ${settings.guessTime/1000}`

    document.getElementById("maxRoundsDisplay").innerHTML = `Maximum Rounds: ${settings.maxRounds}`


    document.getElementById("promptLocationContainer").display = (settings.showLocation) ? "inline":"none"
    document.getElementById("showLocationDisplay").innerHTML = `Show Location: ${(settings.showLocation) ? "True": "False"}`
})

//puts (admin) next to new admin if needed
socket.on("adminUpdate", (updateId)=>{
    document.getElementById(`name${updateId}`).innerHTML =document.getElementById(`name${updateId}`).innerHTML+ " (admin)"
    
})