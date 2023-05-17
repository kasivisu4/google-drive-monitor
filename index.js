let http = require("http");
let express = require("express");
let Session = require("express-session");
let { google } = require("googleapis");
let bodyParser = require("body-parser");

require("dotenv").config();
const ClientId = process.env.CLIENT_ID;
const ClientSecret = process.env.CLIENT_SECRET;
const RedirectionUrl = process.env.REDIRECT_URL;

let app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());

app.use(
  Session({
    secret: "secretKey",
    resave: true,
    saveUninitialized: true,
  })
);

function getOAuthClient() {
  return new google.auth.OAuth2(ClientId, ClientSecret, RedirectionUrl);
}

function getAuthUrl() {
  const oauth2Client = getOAuthClient();

  // generate a url that asks permissions for Google+ and Google Calendar scopes
  let scopes = ["https://www.googleapis.com/auth/drive"];

  const url = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: "offline",

    // If you only need one scope you can pass it as a string
    scope: scopes,
  });

  return url;
}

app.use("/oauth2callback", function (req, res) {
  let oauth2Client = getOAuthClient();
  let session = req.session;
  let code = req.query.code;
  oauth2Client.getToken(code, async function (err, tokens) {
    // Now tokens contains an access_token and an optional refresh_token. Save them.
    if (!err) {
      oauth2Client.setCredentials(tokens);
      session["tokens"] = tokens;
      res.redirect("/home");
    } else {
      res.send(`
            <h3>Login failed!!</h3>
        `);
    }
  });
});

app.use("/home", async function (req, res) {
  console.log(req.session.tokens.access_token);
  let files = await fetch("http://localhost:5500/list", {
    method: "POST",
    body: JSON.stringify({ token: req.session.tokens.access_token }),
  });
  res.send(`${files}`);
});

app.post("/list", async function (req, res) {
  console.log(req);
  let oauth2Client = getOAuthClient();
  oauth2Client.setCredentials(req.body.token);

  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const response = await drive.files.list({
    pageSize: 10,
    fields: "nextPageToken, files(id, name)",
  });
  const files = response.data.files;
  if (files.length === 0) {
    console.log("No files found.");
    return;
  }

  return files;
});

app.use("/", function (req, res) {
  let url = getAuthUrl();
  res.send(`
  <h1 style="text-align: center;padding:20px">Google Drive Monitor</h1>
  <div style="padding:20px">
      <div style="display:flex;justify-content:space-around">
          <p>*This page helps you to monitor only files present in your google drive</p>
          <div>

              <div style="display: flex">
                  <label>Status: </label>
                  <div id="status" style="padding-left:10px"> Not Connected ⚠️</div>
              </div>
              <div style="padding:10px;padding-left:50px">
                  <button id="authorize_button" class="btn btn-primary"><a href=${url}  class="link-dark" style='text-decoration: none;'>Connect</a></button>
              </div>
          </div>
      </div>
  </div>
  </script>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/css/bootstrap.min.css" rel="stylesheet"
      integrity="sha384-KK94CHFLLe+nY2dmCWGMq91rCGa5gtU4mk92HdvYe+M/SXH301p5ILy+dN9+nJOZ" crossorigin="anonymous">
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/js/bootstrap.bundle.min.js"
      integrity="sha384-ENjdO4Dr2bkBIFxQpeoTz1HIcje39Wm4jDKdf19U8gI4ddQ3GYNS7NTKfAdVQSZe"
      crossorigin="anonymous"></script>
      `);
});

let port = 5500;
let server = http.createServer(app);
server.listen(port);
server.on("listening", function () {
  console.log(`listening to ${port}`);
});
