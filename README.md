**There's a few things you need to set up.**

1) I'm running this through PM2, on a Ubuntu 16.04 server on Digital Ocean. Create a non-root user w/ root privileges. If adding a password for non-root user, make sure to edit your `/etc/ssh/sshd_conf` file to `PasswordAuthentication yes`.

2) Once you are able to login to the non-root user, you'll  need to install a few global dependencies like `pm2` & `yarn`. Then set up your `bots` database in the mongo shell, and import the JSON** of your users:
         
         > mongoimport --db bots --collection collectionName users.json

3) Back in the linux shell, install dependencies for Chromium:
         
          sudo apt-get install gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
  
4) Add your dot.env file in the root of your project to "feed" the config.js file:

        NODEMAILER_TYPE=oAuth2
        NODEMAILER_USER=testemail@gmail.com
        NODEMAILER_CLIENT_ID=spodfjih0897a0pqjouiysuolnjskahbjdvf.apps.googleusercontent.com
        NODEMAILER_CLIENT_SECRET=kljdfnsbifuk7SAFi56SDhdms
        NODEMAILER_REFRESH_TOKEN=posidfouhiYii87b6iKASJ8giubdlj
        NODE_ENV=production

5) Start the bots:

         pm2 start app.js -n bots



** JSON FORMAT:

        {
        email: "test@testing.com",
        name: "Matt Tester",
        senateCandidate: false,
        senate: false,
        fara: true
        }
