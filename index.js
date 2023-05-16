//Reference Link: https://developers.google.com/drive/api/quickstart/js
//Update CLIENT_ID and API key from the developer console
const CLIENT_ID = process.env.CLIENT_ID;
const API_KEY = process.env.API_KEY;

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC =
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/drive";

let tokenClient;
let gapiInited = false;
let gisInited = false;

document.getElementById("authorize_button").style.visibility = "hidden";
document.getElementById("signout_button").style.visibility = "hidden";

/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
  gapi.load("client", initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
  maybeEnableButtons();
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: "", // defined later
  });
  gisInited = true;
  maybeEnableButtons();
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    document.getElementById("authorize_button").style.visibility = "visible";
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw resp;
    }
    console.log(resp);
    document.getElementById("signout_button").style.visibility = "visible";
    document.getElementById("authorize_button").innerText = "Refresh";
    await listFiles();
  };

  if (gapi.client.getToken() === null) {
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
    tokenClient.requestAccessToken({ prompt: "consent" });
  } else {
    // Skip display of account chooser and consent dialog for an existing session.
    tokenClient.requestAccessToken({ prompt: "" });
  }
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken("");
    document.getElementById("details").innerText = "";
    document.getElementById("authorize_button").innerText = "Authorize";
    document.getElementById("signout_button").style.visibility = "hidden";
  }
}

/**
 * Print metadata for first 10 files.
 */
async function listFiles() {
  let response;
  try {
    response = await gapi.client.drive.files.list({
      pageSize: 10,
      fields: "files(id, name,webContentLink)",
    });
  } catch (err) {
    document.getElementById("details").innerText = err.message;
    return;
  }
  const files = response.result.files;
  if (!files || files.length == 0) {
    document.getElementById("details").innerText = "No files found.";
    return;
  }

  document.getElementById(
    "details"
  ).innerText = `Total Files : ${files.length}`;

  let renderDrive = document.getElementById("driveDetails");

  files.forEach((file) => {
    let div = document.createElement("div");
    let input = document.createElement("input");
    input.type = "checkbox";
    input.value = file.webContentLink;
    input.className = "selectedFiles";

    let label = document.createElement("label");
    label.appendChild(document.createTextNode(file.name));
    div.appendChild(input);
    div.appendChild(label);

    renderDrive.appendChild(div);
  });

  let downloadButton = document.getElementById("download");
  downloadButton.addEventListener("click", async () => {
    let selectedIds = [];
    let selectedFiles = Array.from(document.querySelectorAll(".selectedFiles"));
    for (let node of selectedFiles) {
      if (node.checked) {
        selectedIds.push(node.value);
      }
    }

    //Download the files
    if (selectedIds.length === 0) {
      console.log("No files selected for download.");
      return;
    }

    // Iterate through the selected file IDs and download each file
    for (let fileLink of selectedIds) {
      console.log(fileLink);
      try {
        const element = document.createElement("a");
        element.href = fileLink;
        element.style.display = "none";
        element.click();
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Perform further actions with the downloaded file data
        // For example, you can save the file locally or process it in some way.
      } catch (err) {
        console.error("Error downloading file:", err);
      }
    }
  });
}

// // Flatten to string to display
// const output = files.reduce(
//   (str, file) => `${str}${file.name} (${file.id})\n`,
//   "Files:\n"
// );
