You must do a number of things to set up the bots.

1) Install dependencies for headless Chrome
sudo apt-get install gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

2) Create keys directory, add users.js for users app:

const users = [
{
    email: "test@gmail.com",
    name: "Test Testy",
    senateCandidate: true,
    senate: true,
    fara: false    
}
]
  
  module.exports = users;

  3) Still in the keys folder, add a config.js for your mailer app. This must be configured through gmail's o-auth system:

  const auth = {
    type: "OAuth2",
    user: "test@testy.com",
    clientId: "sdf-sfsdf0-asdfa/sdfassdaaqp7.apps.googleusercontent.com",
    clientSecret: "os8dj9af7hwafuoip",
    refreshToken: "af9w7suodhijpaodsfobiuoasipdf"
  }
  
  module.exports = {
    auth
  }