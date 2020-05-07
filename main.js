const electron = require('electron');
const url = require('url');
const path = require('path');
const { spawn } = require('child_process');

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
    const command = 'tracert'
    const args = ['-h','255',url]
    execute(command, args, parseIP);
});

//parse output from command prompt
async function parseIP(data){
    const ip = findIP(data);
    if(ip == null)
        return;
    const geoLocData = await getGeoLocationData(ip);
    if(geoLocData == null)
        return;

    //console.log(geoLocData.latitude,geoLocData.longitude);

    mainWindow.webContents.send('ip', ip);
    mainWindow.webContents.send('geoLocData', geoLocData);
}

async function getGeoLocationData(ip){
    const ACCESS_KEY = '001abf6bf4e9cdfb870012aa573a2e80';
    const baseURL = 'http://api.ipstack.com/'

    const geoLocData = {city: '', latitude: '', longitude: ''}
    const hitURL = baseURL + ip + '?access_key=' + ACCESS_KEY + '&fields=city,latitude,longitude'
    //console.log(hitURL);
    const res = await fetch(hitURL).catch(handleFetchError)
    const data = await res.json()
    if(data.city==null || data.latitude == null || data.longitude == null)
        return null;
    geoLocData.city = await data.city;
    geoLocData.latitude = await data.latitude;
    geoLocData.longitude = await data.longitude;
    console.log(data.city);
    return geoLocData;
}

function handleFetchError(err){
    console.log(err)
    let res = new Response(
        JSON.stringify()
    )
    return res
}

//Create list of ip
function findIP(data){
    const flagString = 'over a maximum of 255 hops';
    if(data.indexOf(flagString)!=-1)
        return null;
    data = data.toString();
    console.log(data);
    //regexp to match a single ipv4 address from line
    const regExp = /(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(?=\s|\])/g;
    const ipMatches = [...data.matchAll(regExp)];
    if(ipMatches == null || ipMatches.length==0)
        return null;
    const ip = ipMatches[0][0];
    console.log('IP found:', ip);
    if(isPublicIPv4(ip))
        return ip;
    else
        return null;
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
//processData is my callback
function execute(command, args, processData) {
    const tracert = spawn(command, args);

    tracert.stdout.on('data', (data) => {
        processData(data);
    });

    tracert.stderr.on('data', (data) => {
        mainWindow.webContents.send('fail','<br><br> Failed to trace. Please try again later or try a different domain!');
        console.error(`stderr: ${data}`);
    });

    tracert.on('close', (code) => {
        if(code == 0)
            mainWindow.webContents.send('success','<br><br> Trace Completed. Enjoy!')
        else
            mainWindow.webContents.send('fail','<br><br> Failed to trace. Please try again later or try a different domain!');
        console.log(`child process exited with code ${code}`);
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