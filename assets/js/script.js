state = {
  loggedIn: false,
  wallet: null,
  jwk: null
};

//Modal:
// Get the modal
var modal = document.getElementById("myModal");
var modal2 = document.getElementById("myModal2");

// Get the button that opens the modal
var btn = document.getElementById("loginBtn");
var btn2 = document.getElementById("decrypt");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal
btn.onclick = function() {
  if (state.loggedIn) {
    location.reload();
  }
  modal.style.display = "block";
};

btn2.onclick = function() {  
  modal2.style.display = "block";
};

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

window.onclick = function(event) {
  if (event.target == modal2) {
    modal2.style.display = "none";
  }
};

//login 
var getFile = document.getElementById("keyfile");

getFile.onchange = function(e) {
  var filelist = getFile.files;
  if (filelist) {
    login(filelist, function(ev) {
      try {
        wallet = JSON.parse(ev.target.result);

        arweave.wallets.jwkToAddress(wallet).then((address) => {
          loginHandler(wallet, address);
            console.log(address);


            arweave.wallets.getBalance(address).then(balance => {
              let winston = balance;
              let ar = arweave.ar.winstonToAr(balance);

              document.getElementById("wallet").innerHTML =
                                            "<br><b>Wallet:</b> " + address + "<br><b>Balance:</b> " + ar;
              console.log(winston);

              console.log(ar);
        });
      });
      } catch (err) {
        alert("Error logging in. Please try again.");
        getFile.value = "";
        success = false;
      } finally {
      }
    });
  }
};

 async function loginHandler(jwk, address) {
  state.loggedIn = true;
  state.wallet = address;
  state.jwk = jwk;
  document.getElementById("loginBtn").innerText = "Log Out";
  modal.style.display = "none";

  const txids = await arweave.arql({
    op: "and",
    expr1: {
      op: "equals",
      expr1: "from",
      expr2: address
    },
    expr2: {
      op: "equals",
      expr1: "Application-ID",
      expr2: "CMemoirs"
    }
  });
  state.loggedIn = true;
  var recentMemoirs = document.getElementById("savedMemoirs");
  for (var i = 0; i < Math.min(10, txids.length); i++) {
    let tx = await getMemoirFromId(txids[i]);
    recentMemoirs.innerHTML += `<div class="postbox shadow-sm my-3">
    <div class="mx-2 py-1">
      <div class="posttitle my-1"><a href="?memoirId=${txids[i]}">${tx.Title}</a></div>
      <div class="postdate">${tx["Syntax-Highlight"]}</div>
    </div>
  </div>`;
  }

  console.log(txids);
}
async function sendM() {
  if (state.loggedIn) {
    var memoir = document.getElementById("text").value;
    console.log(memoir);

    var targetA = document.getElementById("targetAdress").value;
    console.log(targetA);
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
    
    today = dd + '/' + mm + '/' + yyyy;
    console.log(today);
    var title =  "Sent to adress: " + " " + targetA + " " + today + " " + ":" + " "+ document.getElementById("textInput").value || "Untitled Save";
    var transaction = await arweave.createTransaction(
      {
        target: targetA,
        data: memoir,
      },
      state.jwk
    );
    transaction.addTag("Application-ID", "CMemoirs");
    transaction.addTag("Title", title);

    await arweave.transactions.sign(transaction, state.jwk);
    const response = await arweave.transactions.post(transaction);
    console.log(response.status);
    displayHeader(transaction.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    alert("You must be signed in to save a memoir.");
  }
}

async function saveM() {
  if (state.loggedIn) {
    var memoir = document.getElementById("text").value;
    console.log(memoir);

    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); 
    var yyyy = today.getFullYear();
    
    today = mm + '/' + dd + '/' + yyyy;
    console.log(today);
    var title =  today + " " + ":" + " "+ document.getElementById("textInput").value || "Untitled Save";
    var transaction = await arweave.createTransaction(
      {
        data: memoir
      },
      state.jwk
    );
    transaction.addTag("Application-ID", "CMemoirs");
    transaction.addTag("Title", title);
    await arweave.transactions.sign(transaction, state.jwk);
    const response = await arweave.transactions.post(transaction);
    displayHeader(transaction.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    alert("You must be signed in to save a memoir.");
  }
}
var send = document.getElementById("send");

send.onclick = function() {
  sendM();
};

var save = document.getElementById("save");

save.onclick = function() {
  saveM();
};

function displayHeader(memoirId) {
  var h = document.getElementById("headertext");
  var id = document.getElementById("newMemoirid");
  id.innerText = memoirId;
  id.href = "?memoirId=" + memoirId;
  h.classList.remove("displaynone");
  h.classList.remove("hidden");
  h.classList.add("visible");
}

function toggleMain(tags) {
  var p = document.getElementById("memoirDisplay");
  var f = document.getElementById("newMemoir");

  document.getElementById("memoirName").innerText = "Memoir  " + tags.Title;
  document.getElementById("memoirText").innerText = tags.Text;

  f.classList.add("displaynone");
  p.classList.remove("displaynone");
}

//get url vars
function getUrlVars() {
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
    vars[key] = value;
  });
  return vars;
}

//this one gets the transaction data, saved memoir data (text)
async function getMemoir(txid) {
  var transaction;
  try {
    transaction = await arweave.transactions.get(txid);
  } catch {
    alert("Invalid memoir. ID is either invalid, or it hasn't been uploaded to the blockchain yet. Try again in a few minutes.");
  }
  var text = transaction.get("data", { decode: true, string: true });
  var tags = {};
  tags["Text"] = text;
  transaction.get("tags").forEach((tag) => {
    let key = tag.get("name", { decode: true, string: true });
    let value = tag.get("value", { decode: true, string: true });
    
    tags[key] = value;
  });
  toggleMain(tags);
}

//this block decodes all of the recent posts
async function getMemoirFromId(txid) {
  var transaction = await arweave.transactions.get(txid);
  var tags = {};
  transaction.get("tags").forEach((tag) => {
    let key = tag.get("name", { decode: true, string: true });
    let value = tag.get("value", { decode: true, string: true });
    tags[key] = value;

  });
  return tags;
}


