const electron = require('electron');
const url = require('url');
const path = require('path');

const {app, BrowserWindow, Menu} = electron;

const engine = require('./src/js/engine')

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
        pathname: path.join(__dirname, 'src/html/'+'mainWindow.html'),
        protocol: 'file',
        slashes: true
    }));

    //Build menu from th template below
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);

    //run engine
    engine(mainWindow);
});

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