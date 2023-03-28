export default function ()
{
    this.players = {};

    this.addPlayer = (socketId, name, ) =>
    {
        this.players[socketId] = {name:name, points:0 }; 
    }
    
    this.removePlayer = (socketID) =>
    {
        delete this.players[socketID]
    }

}
