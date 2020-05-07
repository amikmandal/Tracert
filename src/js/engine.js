function engine(mainWindow) {
    const { spawn } = require('child_process');
    const electron = require('electron');
    const {ipcMain} = electron;

    const getGeoLocData = require('./ipstack.js');

    //Catch url entered
    ipcMain.on('url', function(e,url){
        const command = 'tracert'
        const args = ['-h','255',url]
        execute(command, args, parseIP);
    });

    //run cmd.exe with a given command
    //processData is my callback
    function execute(command, args, processData) {
        const shell = spawn(command, args);

        shell.stdout.on('data', (data) => {
            processData(data);
        });

        shell.stderr.on('data', (data) => {
            mainWindow.webContents.send('fail','<br><br> Failed to trace. Please try again later or try a different domain!');
            console.error(`stderr: ${data}`);
        });

        shell.on('close', (code) => {
            if(code == 0)
                mainWindow.webContents.send('success','<br><br> Trace Completed. Enjoy!')
            else
                mainWindow.webContents.send('fail','<br><br> Failed to trace. Please try again later or try a different domain!');
            console.log(`child process exited with code ${code}`);
        });
    };

    //parse output from command prompt
    async function parseIP(data){
        const ip = findIP(data);
        if(ip == null)
            return;
        const geoLocData = await getGeoLocData(ip);
        if(geoLocData == null)
            return;

        //console.log(geoLocData.latitude,geoLocData.longitude);

        //render data to the page
        mainWindow.webContents.send('ip', ip);
        mainWindow.webContents.send('geoLocData', geoLocData);
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
}

module.exports = engine