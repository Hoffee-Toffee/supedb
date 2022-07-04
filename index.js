var request = require("request")
var RestDB_API = "KEY_62c27fbfe91195203e3aa7b9"
RestDB_API = RestDB_API.slice(4)

var options = {
  method: "GET",
  url: "https://timelines-3cbe.restdb.io/rest/timelines",
  headers: {
    "cache-control": "no-cache",
    "x-apikey": RestDB_API
  }
}

window.onload = function() {
  request(options, function (error, response, body) {
    if (error) throw new Error(error)

    maps = JSON.parse(body)

    maps.forEach(map => {
      var tag = document.createElement("a")
      tag.id = map.title
      tag.href = "map.html?id=" + map._id
      tag.classList.add("map")

      var text = document.createElement("h2")
      text.innerText = map.title
      tag.appendChild(text)

      var descbox = document.createElement("p")
      descbox.innerText = map.description
      descbox.classList.add("description")
      tag.appendChild(descbox)

      if (map.encrypted) tag.setAttribute("encrypted", true)
      
      document.getElementById("map-menu").appendChild(tag)
    })
  })
}