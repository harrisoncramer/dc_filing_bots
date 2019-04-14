**There's a few things you need to set up.**

1) Install dependencies for headless Chrome
         
          sudo apt-get install gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
  
2) Add your dot.env file to feed the config.js file.

        NODEMAILER_TYPE=oAuth2
        NODEMAILER_USER=testemail@gmail.com
        NODEMAILER_CLIENT_ID=spodfjih0897a0pqjouiysuolnjskahbjdvf.apps.googleusercontent.com
        NODEMAILER_CLIENT_SECRET=kljdfnsbifuk7SAFi56SDhdms
        NODEMAILER_REFRESH_TOKEN=posidfouhiYii87b6iKASJ8giubdlj
        NODE_ENV=development

3) Spin up a mongodb server, filled with user data. (Alternatively user.js file in keys folder). Each user should look like this:

        {
        email: "test@testing.com",
        name: "Matt Tester",
        senateCandidate: false,
        senate: false,
        fara: true
        }

It's important that the mongodb folder have a collection within a 'bots' database for each bot. I'm using 'fara','senators',and 'senateCandidates' as my three collections currently.
        
I'm running this through PM2, on a Ubuntu 18.02 server on Digital Ocean.