const electron = require('electron');
const url = require('url');
const path = require('path');
const exec = require('child_process').exec;
const fetch = require("node-fetch")

const {app, BrowserWindow, Menu, ipcMain} = electron;

let mainWindow;

//Listen when app is ready
app.on('ready', function(){
    //Creates a new window
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        }
    });
    //Gets path to run the html
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol: 'file',
        slashes: true
    }));

    //Build menu from th template below
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);
});

//Catch url entered
ipcMain.on('url', function(e,url){
    execute('tracert -h 255 ' + url, parseOutput);
});

//parse output from command prompt
function parseOutput(output){
    console.log(output)
    const ipList = makeiplist(output);
    mainWindow.webContents.send('ipList', ipList);
    getGeoLocationData(ipList);
    
}

async function getGeoLocationData(ipList){
    const ACCESS_KEY = '001abf6bf4e9cdfb870012aa573a2e80';
    const baseURL = 'http://api.ipstack.com/'

    geoLocData = {city: [], latitude: [], longitude: []}
    for(i=0; i<ipList.length; i++){
        const hitURL = baseURL + ipList[i] + '?access_key=' + ACCESS_KEY + '&fields=city,latitude,longitude'
        const res = await fetch(hitURL).catch(handleFetchError)
        const data = await res.json()
        if(data.city==null || data.latitude == null || data.longitude == null)
            continue;
        geoLocData.city.push(data.city);
        geoLocData.latitude.push(data.latitude);
        geoLocData.longitude.push(data.longitude);
        //console.log(geoLocData.city[i],geoLocData.latitude[i],geoLocData.longitude[i])
    }

    await mainWindow.webContents.send('geoLocData', geoLocData);
    
}

function handleFetchError(err){
    console.log(err)
    let res = new Response(
        JSON.stringify()
    )
    return res
}

//Create list of ip
function makeiplist(output){
    const splitString = 'over a maximum of 255 hops';
    const splitIndex = output.indexOf(splitString) + splitString.length;
    const searchString = output.substring(splitIndex);

    //regexp to match ipv4 address
    const regExp = /(?<=\s|\[)(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(?=\s|\])/g;
    const ipMatches = [...searchString.matchAll(regExp)];
    let ipList = [];
    for(i=0; i<ipMatches.length; i++){
        const match = ipMatches[i] 
        if(isPublicIPv4(match)){
            //console.log("true " + i)
            ipList.push(match[0]);
        }
    }
    return ipList
}

//verify its a public ipv4 address
function isPublicIPv4(match){
    const octet1 = match[1]
    const octet2 = match[2]
    if(octet1==10)
        return false
    else if(octet1==172 && octet2 >= 16 && octet2 <= 31)
        return false
    else if(octet1==192 && octet2 == 168)
        return false
    else
        return true
}


//run cmd.exe with a given command
function execute(command, callback) {
    exec(command, (error, stdout, stderr) => { 
        callback(stdout); 
    });
};

//Create menu template as an array
const mainMenuTemplate = [
    {
        label: 'File',
        submenu:[
            {
                label: 'New',
                role: 'reload',
            },
            {
                label: 'Quit',
                //accelerator does hot keys
                accelerator: process.platform == 'darwin' ?  'Command+Q' : 'Ctrl+Q',
                click(){
                    app.quit()
                }
            }
        ]
    }
]

//Add developer tools when not in prod
if(process.env.NODE_ENV !== 'production'){
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [
            {
                label: 'Toggle Dev Tools',
                accelerator: process.platform == 'darwin' ?  'Command+D' : 'Ctrl+D',
                click(item, focusedWindow){
                    //open dev tools on the focused window
                    focusedWindow.toggleDevTools();
                }
            }
        ]
    });
}