//Reference Link: https://developers.google.com/drive/api/quickstart/js
//Change If needed CLIENT_ID and API key from the developer console
const CLIENT_ID =
  "276639897094-d27mg95pcja2n2ubkld74us0373h1q86.apps.googleusercontent.com";
const API_KEY = "AIzaSyAT7CmyITspnXjLWVPzXOvguKBt0CJZYlQ";

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC =
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";

const SCOPES = "https://www.googleapis.com/auth/drive";

let tokenClient;
let gapiInited = false;
let gisInited = false;

document.getElementById("authorize_button").style.visibility = "hidden";
document.getElementById("signout_button").style.visibility = "hidden";
document.getElementById("download_button").style.visibility = "hidden";
document.getElementById("status").innerHTML = "Not Connected ⚠️";

function gapiLoaded() {
  gapi.load("client", initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
  maybeEnableButtons();
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: "",
  });
  gisInited = true;
  maybeEnableButtons();
}

function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    document.getElementById("authorize_button").style.visibility = "visible";
  }
}

function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw resp;
    }
    console.log(resp);
    document.getElementById("signout_button").style.visibility = "visible";
    document.getElementById("authorize_button").innerText = "Refresh";
    document.getElementById("status").innerHTML = "Connected 🟢";

    await listFiles();
  };

  if (gapi.client.getToken() === null) {
    tokenClient.requestAccessToken({ prompt: "consent" });
  } else {
    tokenClient.requestAccessToken({ prompt: "" });
  }
}

function handleSignoutClick() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken("");
    document.getElementById("details").innerText = "";
    document.getElementById("authorize_button").innerText = "Authorize";
    document.getElementById("signout_button").style.visibility = "hidden";
    document.getElementById("status").innerHTML = "Disconnected ❌";
    document.getElementById("download_button").style.visibility = "hidden";
  }
}

async function listFiles() {
  let response;
  try {
    response = await gapi.client.drive.files.list({
      pageSize: 10,
      fields:
        "files(id,name,webContentLink,permissions(emailAddress),mimeType)",
    });
  } catch (err) {
    document.getElementById("details").innerText = err.message;
    return;
  }
  const files = response.result.files;
  console.log(files);

  if (!files || files.length == 0) {
    document.getElementById("details").innerText = "No files found.";
    return;
  }

  document.getElementById(
    "details"
  ).innerText = `Total Files : ${files.length}`;

  // document.getElementById("download_button").style.visibility = "visible";

  let renderDrive = document.getElementById("driveDetails");

  let keys = ["name", "emailAddress", "webContentLink", "id", "mimeType"];

  let table = document.createElement("table");
  table.className = "table";
  // Create the table header
  let thead = document.createElement("thead");
  thead.className = "thead-dark";
  let headerRow = document.createElement("tr");
  ["File Name", "Accessible By", "Download Link", "id", "mimeType"].forEach(
    function (key) {
      let th = document.createElement("th");
      th.textContent = key;
      headerRow.appendChild(th);
    }
  );
  thead.appendChild(headerRow);
  table.appendChild(thead);

  let tbody = document.createElement("tbody");
  files.forEach((file) => {
    let tr = document.createElement("tr");
    tr.style = "max-width:400px";
    keys.forEach(function (value) {
      let td = document.createElement("td");
      td.style = "max-width:400px;overflow-wrap: break-word;";
      if (value === "emailAddress") {
        td.textContent = file["permissions"]?.map((d) => d[value]);
      } else if (value === "id") {
        let btn = document.createElement("button");
        btn.innerText = file.id;
        btn.addEventListener("click", async (evt) => {
          console.log("event", evt);
          console.log("id", file.id);
          await download(file.id, file.mimeType);
        });
        td.appendChild(btn);
      } else if (value === "webContentLink") {
        console.log("webContentLink value", file.webContentLink);
        let a = document.createElement("a");
        a.href = file?.webContentLink;
        a.innerText = "Download";
        if (!file.webContentLink) {
          a.style = "visibility:hidden";
        }
        td.appendChild(a);
      } else {
        td.textContent = file[value] || "-";
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  renderDrive.appendChild(table);
}

async function download(fileId) {
  try {
    const webContentLink = gapi.client.drive.files
      .get({
        fileId: fileId,
      })
      .then(function (response) {
        console.log(response.data.webContentLink);
        return response.data.webContentLink;
      });
  } catch (err) {
    // TODO(developer) - Handle error
    throw err;
  }
}
//   let downloadButton = document.getElementById("download_button");
//   downloadButton.addEventListener("click", async () => {
//     let selectedIds = [];
//     let selectedFiles = Array.from(document.querySelectorAll(".selectedFiles"));
//     for (let node of selectedFiles) {
//       if (node.checked) {
//         selectedIds.push(node.value);
//       }
//     }

//     //Download the files
//     if (selectedIds.length === 0) {
//       console.log("No files selected for download.");
//       return;
//     }

//     // Iterate through the selected file IDs and download each file
//     for (let fileLink of selectedIds) {
//       try {
//         const element = document.createElement("a");
//         element.href = fileLink;
//         element.style.display = "none";
//         element.click();
//         await new Promise((resolve) => setTimeout(resolve, 5000));

//         // Perform further actions with the downloaded file data
//         // For example, you can save the file locally or process it in some way.
//       } catch (err) {
//         console.error("Error downloading file:", err);
//       }
//     }
//   });
// }
