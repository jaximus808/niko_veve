
*Needed Downloads*

node.js 
npm

*To run the server locally*

first create the sql server and update the values in the .env file (enviornment variables)

you need to create a .env file in the root directory of this project and then add 

PORT = <PORT>
SQLHOST = <HOST>
SQLUSER = <USER>
SQLPWD = <PWD>
DATABASENAME = <DBNAME>

then open up the terminal in this directory (ensure the same directory as package.json) and run "npm install"
this will run through the package.json and download all the packages for you automatically 

You can then port the sqlExport file into your SQL database and set this up as you like 

once all these are done go into the route from the terminal and type the command "npm run dev", this will run nodemon which will automatically refresh the server if there are any changes to the code. If you don't want this then run "npm run start" which will instead start the project normally

if this is running on your machine you can use the link
"localhost:3000" and it should display the homepage.

if you want others on the same network to connect give them your private ip (this you can look up how to do) and send them the link {ip}:3000 and if done correctly should display the game

*To run on a cloud provider* 

This very much depends on the cloud provider, but running the server should be simple.

In the server dashboard there should be a place for enviornment variables, simply set those correctly to what is set in the .env file. The servers can't read the .env file during production so their built in way will allow it.

From there look for an Node.js hosting method and from there it should port smoothly, if something goes wrong you an look up some trouble shooting methods online. 

Some of my favorites

Azure
-really easy to set up with node.js, you pretty much just login in and click deploy and everything should work 

Repl.it
-This is not really good for long term hosting but it can be used for small testing with a group of friends since it is still hosted on Repl.it servers and not on your machine. However you will need to implement an SQL server with it

AWS
-AWS is really popular, and even though is not my personal use, it has the capabilities to do what you need it to do

Vercel
-it has an excellent free package to use for hosting when testing the actual deployment of the server 

*How this project works* 

This project uses socket.io to handle websockets and such. These scripts can be found in the /backend_game directory

for the HTTP (webserver) itself this code can be found in the app.js file. In this file it uses the express.js package to create listeners for GET requests on certain routes. A route is the /routeName after the top www.website.com. 

The html files are served from the public folder, this serving can be found in the express.static() function which uses the route to the folder with the html/css/ and js folders. The index.html file is what is shown on the route. Each folder correlates to a specific page (i.e. /homepage and /game). You can change these files just make sure there is an index.html file and all assets are in the respective folder. 

if you want to add more pages then first create a new folder in the public folder, give it a name, and put your html code inside

Once that's done you can serve it by adding this line in the app.js file
"app.use("{   route  }",express.static(path.join(__dirname,'public', '{  folder name  }')));"

inside the {   route   } replace this value with the route you want to use (for example, "/game/info/)

inside {   folder name   } add the name of the new folder you just created 

ensure the line is above 
"httpServer.listen(process.env.PORT || 3000, console.log("Server up"));" 
and before 
"const roomManager = new RoomManager(io);"

The images of the real estate are served from the server using the estateIamges route and then sends that to the sendFile function. Routes with the :name is a dynamic route and the value of :name is passed in to get the image from this server. 

*How the Database works*

In the sql database the system that I use is the location, price, links to the iamges in this server, and the description. There are each individual columns. There is also an EstateID which is auto incremented.

You can use the sql comamnd "INSERT INTO estateData (realestateName, location, estateImages, description) VALUES ("")"
to insert new data (plugging in the appropiate data in the ("") area)

images of the real estate is stored in the estateImages folder and the server has a listener that hosts this folder and serves them based on the name they input. This can be seen in the line

app.get("/api/images/:name", (req, res) =>
{
    res.sendFile(path.join(__dirname, "estateImages",req.params.name))
})

the web server will send the image based on the route which the naem will be stored in :name


*Final words* 

There are many resources online for how these resources work if you want to do further work on it. If you have any questions feel free to contact me with questions or other features you may want to add. it was very enjoyable working with you!

you can view the code on github here: https://github.com/jaximus808/niko_veve