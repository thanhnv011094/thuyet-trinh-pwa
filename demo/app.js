const apiKey = '5c2a2e3b93644dbc9d930cd2798e4a19';
const defaultSource = 'the-washington-post';
const sourceSelector = document.querySelector('#sources');
const newsArticles = document.querySelector('main');
/*
function notifyMe() {
  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notification");
  }

  // Let's check whether notification permissions have already been granted
  else if (Notification.permission === "granted") {
    // If it's okay let's create a notification
    var notification = new Notification("Hi there!");
  }

  // Otherwise, we need to ask the user for permission
  else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(function (permission) {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
        var notification = new Notification("Hi there!");
      }
    });
  }

  // At last, if the user has denied notifications, and you
  // want to be respectful there is no need to bother them any more.
}
*/

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    if (Notification.permission === 'granted') {
      //do something
      subscribePush();
      $('#allow-push-notification-bar').hide();
    }
    else if (Notification.permission === 'default') {
      $('#allow-push-notification-bar').show();

      $('#allow-push-notification').click(function () {
        $('#allow-push-notification-bar').hide();
        Notification.requestPermission().then(function (status) {
          if (status === 'denied') {
            //do something
          } else if (status === 'granted') {
            //do something
            subscribePush();
          }
        });
      });
      $('#close-push-notification').click(function () {
        $('#allow-push-notification-bar').hide();
      });
    }
    navigator.serviceWorker.register('./sw.js').then(function (registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);



    }, function (err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });

  // Public base64 to Uint
  function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

function subscribePush() {
  navigator.serviceWorker.ready.then(function (registration) {
    // Use the PushManager to get the user's subscription to the push service.
    registration.pushManager.getSubscription()
      .then(async function (subscription) {
        // If a subscription was found, return it.
        if (subscription) {
          return subscription;
        }

        const response = await fetch('http://localhost:3000/vapidPublicKey');
        const vapidPublicKey = await response.text();
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        console.log('vapidPublicKey: ', vapidPublicKey);

        // Otherwise, subscribe the user (userVisibleOnly allows to specify
        // that we don't plan to send notifications that don't have a
        // visible effect for the user).
        return registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      })
      .then(async function (subscription) {
        // Here you can use the subscription.
        console.log('Subscription object: ', subscription);
        console.log(JSON.stringify({
          subscription: subscription,
          delay: 5,
          ttl: 10,
        }));

        var rawResponse = await fetch('http://localhost:3000/register', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(subscription)
        });
        const content = await rawResponse.json();
        console.log(content);
      });
  });
}

window.addEventListener('load', e => {
  sourceSelector.addEventListener('change', evt => {
    var selected = evt.target[evt.target.selectedIndex];
    updateNews(selected.value, selected.text)
  });
  updateNewsSources().then(() => {
    sourceSelector.value = defaultSource;

    var selected = sourceSelector[sourceSelector.selectedIndex];
    updateNews(selected.value, selected.text)
  });
});

window.addEventListener('online', () => {
  var selected = sourceSelector[sourceSelector.selectedIndex];
  updateNews(selected.value, selected.text)
});

async function updateNewsSources() {
  const response = await fetch(`https://newsapi.org/v2/top-headlines/sources?apiKey=${apiKey}`);
  const json = await response.json();
  sourceSelector.innerHTML =
    json.sources
      .map(source => `<option value="${source.id}">${source.name}</option>`)
      .join('\n');
}

async function updateNews(source = defaultSource, title = 'The Washington Post') {
  newsArticles.innerHTML = '';
  const response = await fetch(`https://newsapi.org/v2/top-headlines?sources=${source}&apiKey=${apiKey}`);
  const json = await response.json();
  newsArticles.innerHTML =
    json.articles.map(createArticle).join('\n');

  document.title = `"${title}" News`;
}

function createArticle(article) {
  return `
    <div class="article">
      <a href="${article.url}">
        <h2>${article.title}</h2>
        <img src="${article.urlToImage}" alt="${article.title}">
        <p>${article.description}</p>
      </a>
    </div>
  `;
}

function geoFindMe() {

  const status = document.querySelector('#status');
  const mapLink = document.querySelector('#map-link');

  mapLink.href = '';
  mapLink.textContent = '';

  function success(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    status.textContent = '';
    mapLink.href = `https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`;
    mapLink.textContent = `Latitude: ${latitude} °, Longitude: ${longitude} °`;
  }

  function error() {
    status.textContent = 'Unable to retrieve your location';
  }

  if (!navigator.geolocation) {
    status.textContent = 'Geolocation is not supported by your browser';
  } else {
    status.textContent = 'Locating…';
    navigator.geolocation.getCurrentPosition(success, error);
  }

}

document.querySelector('#find-me').addEventListener('click', geoFindMe);