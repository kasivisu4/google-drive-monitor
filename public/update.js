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
