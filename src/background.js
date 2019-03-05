const authorization = () => {
  const host = 'https://wakatime.com/oauth/authorize';
  const urlTo = chrome.identity.getRedirectURL();
  console.log(urlTo);
  const query = `?client_id=n6EPrd1dDr90BLBacKukXD21&response_type=code&scope=write_logged_time&redirect_uri=${urlTo}`;

  chrome.identity.launchWebAuthFlow(
    {
      url: `${host}${query}`,
      interactive: true,
    },
    (redirectUrl) => {
      const url = new URL(redirectUrl);
      const temp = url.search.split('?code=');
      console.log('put', temp[1]);
      console.log(chrome.storage.local);
      chrome.storage.local.set({ wakatoken: temp[1] }, () => console.log('token saved'));
    },
  );
};

chrome.browserAction.onClicked.addListener(authorization);

const send = async (branchName, token) => {
  console.log('send', token);
  const dateInSeconds = () => (new Date() / 1000).toFixed();
  const data = await fetch('https://wakatime.com/api/v1/users/current/heartbeats', {
    method: 'POST',
    body: JSON.stringify({
      entity: `${branchName} code reviewing`,
      time: dateInSeconds(),
      branch: branchName,
      project: 'hc_market',
      category: 'code reviewing',
    }),
    'Content-Type': 'application/json',
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
      'Access-Control-Allow-Origin': 'https://wakatime.com',
    },
  });
  if (data.status === 401) {
    authorization();
  }
};

const onMessage = async (request, sender, sendResponse) => {
  const payload = request.branchName;
  if (payload) {
    chrome.storage.local.get(['wakatoken'], ({ wakatoken }) => {
      send(payload, wakatoken);
      console.log('send on load');

      let idle = false;
      const onActivated = (tab) => {
        if (tab.tabId !== sender.tab.id && !idle) {
          send(payload, wakatoken);
          console.log('send on activated another tab');
          idle = true;
        }
        if (tab.tabId === sender.tab.id && idle) {
          send(payload, wakatoken);
          idle = false;
          console.log('send on return');
        }
      };

      chrome.tabs.onActivated.addListener(onActivated);

      const updater = (tabId, { url }) => {
        // console.log(other);
        if (url && tabId === sender.tab.id) {
          send(payload, wakatoken);
          console.log('send on url change');
          chrome.tabs.onUpdated.removeListener(updater);
          console.log('remove updater');
          chrome.tabs.onUpdated.addListener(updater);
          console.log('add updater');
        }
      };

      chrome.tabs.onUpdated.addListener(updater);

      const onRemoved = (tabId) => {
        if (tabId === sender.tab.id) {
          send(payload, wakatoken);
          console.log('send on closed');
          chrome.tabs.onActivated.removeListener(onActivated);
          chrome.tabs.onRemoved.removeListener(onRemoved);
        }
      };

      chrome.tabs.onRemoved.addListener(onRemoved);
    });
  }
  chrome.runtime.onMessage.removeListener(onMessage);
};

chrome.runtime.onMessage.addListener(onMessage);
