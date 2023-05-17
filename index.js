const http = require("http");
const express = require("express");
const Session = require("express-session");
const { google } = require("googleapis");
const bodyParser = require("body-parser");

require("dotenv").config();
const ClientId = process.env.CLIENT_ID;
const ClientSecret = process.env.CLIENT_SECRET;
const RedirectionUrl = process.env.REDIRECT_URL;

const app = express();

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());

app.use(
  Session({
    secret: "secretKey",
    resave: true,
    saveUninitialized: true,
  })
);

app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
app.set("views", __dirname);

function getOAuthClient() {
  return new google.auth.OAuth2(ClientId, ClientSecret, RedirectionUrl);
}

function getAuthUrl() {
  const oauth2Client = getOAuthClient();

  // generate a url that asks permissions for Google+ and Google Calendar scopes
  const scopes = ["https://www.googleapis.com/auth/drive"];

  const url = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: "offline",

    // If you only need one scope you can pass it as a string
    scope: scopes,
  });

  return url;
}

app.use("/oauth2callback", function (req, res) {
  const oauth2Client = getOAuthClient();
  const session = req.session;
  const code = req.query.code;
  oauth2Client.getToken(code, async function (err, tokens) {
    // Now tokens contains an access_token and an optional refresh_token. Save them.
    if (!err) {
      oauth2Client.setCredentials(tokens);
      session["tokens"] = tokens;
      console.log("authorized rendering index file");
      res.sendFile(__dirname + "/public/index.html");
    } else {
      res.send(`
            <h3>Login failed!!</h3>
        `);
    }
  });
});

// Downloads a file from Google Drive using the file ID

app.use("/download", async function (req, res) {
  let fileId = req.body.fileId;
  let oauth2Client = getOAuthClient();
  oauth2Client.setCredentials(req.body.token);

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const response = await drive.files.export({
    fileId: fileId,
    mimeType: "application/pdf", // Replace with the desired export format
  });

  const downloadUrl = fileData.webContentLink;
});

app.use("/list", async function (req, res) {
  console.log("session", req.session);
  let oauth2Client = getOAuthClient();
  oauth2Client.setCredentials(req.session.tokens);

  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const response = await drive.files.list({
    pageSize: 10,
    fields: "files(id, name,webContentLink,permissions(emailAddress),mimeType)",
  });

  const files = response.data.files;

  if (files.length === 0) {
    console.log("No files found.");
    return;
  }

  for (let i = 0; i < files.length; i++) {
    let channel = {
      id: files[i].id,
      type: "web_hook",
      address: "https://google-drive-monitor.onrender.com/change",
    };

    drive.files.watch(
      {
        fileId: files[i].id,
        resource: {
          id: channel.id,
          type: channel.type,
          address: channel.address,
        },
      },
      (err, response) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Subscribed to changes to file");
        }
      }
    );
  }
  res.send(JSON.stringify({ files: files }));
});

app.use("/change", function (req, res) {
  socket.emit("re-render", { render: true });
  console.log("Change");
});

app.use("/", function (req, res) {
  let url = getAuthUrl();
  res.render(__dirname + "/public/connect.html", {
    url,
  });
});

let port = 5500;
server.listen(port);
server.on("listening", function () {
  console.log(`listening to ${port}`);
});
