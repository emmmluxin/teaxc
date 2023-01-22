/*
 *
 * NOTE: The client side of hack.chat is currently in development,
 * a new, more modern but still minimal version will be released
 * soon. As a result of this, the current code has been deprecated
 * and will not actively be updated.
 *
*/

//https://github.com/hack-chat/main/pull/184
//select "chatinput" on "/"
document.addEventListener("keydown", e => {
  if (e.key === '/' && document.getElementById("chatinput") != document.activeElement) {
    e.preventDefault();
    document.getElementById("chatinput").focus();
  }
});

/* ---Markdown--- */

// initialize markdown engine
var markdownOptions = {
  html: false,
  xhtmlOut: false,
  breaks: true,
  langPrefix: '',
  linkify: true,
  linkTarget: '_blank" rel="noreferrer',
  typographer: true,
  quotes: `""''`,

  doHighlight: true,
  langPrefix: 'hljs language-',
  highlight: function(str, lang) {
    if (!markdownOptions.doHighlight || !window.hljs) { return ''; }

    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (__) { }
    }

    try {
      return hljs.highlightAuto(str).value;
    } catch (__) { }

    return '';
  }
};

var md = new Remarkable('full', markdownOptions);

// image handler
var allowImages = false;
var whitelistDisabled = false;
var imgHostWhitelist = [
  'i.imgur.com',
  'imgur.com',
  'share.lyka.pro',
  'cdn.discordapp.com',
  'i.gyazo.com',
  'img.thz.cool',
  'i.loli.net', 's2.loli.net',	//SM-MS图床
  's1.ax1x.com', 's2.ax1x.com', 'z3.ax1x.com', 's4.ax1x.com',	//路过图床
  'i.postimg.cc',		//postimages图床
  'mrpig.eu.org',		//慕容猪的图床
  'gimg2.baidu.com',	//百度
  'files.catbox.moe',	//catbox
  'img.liyuv.top',    //李鱼图床
];

function getDomain(link) {
  var a = document.createElement('a');
  a.href = link;
  return a.hostname;
}

function isWhiteListed(link) {
  return whitelistDisabled || imgHostWhitelist.indexOf(getDomain(link)) !== -1;
}

function mdEscape(str) {
  return str.replace(/(?=(\\|`|\*|_|\{|\}|\[|\]|\(|\)|#|\+|-|\.|!|\||=|\^|~|\$|>|<|'))/g, '\\')
}

md.renderer.rules.image = function(tokens, idx, options) {
  var src = Remarkable.utils.escapeHtml(tokens[idx].src);

  if (isWhiteListed(src) && allowImages) {
    var imgSrc = ' src="' + Remarkable.utils.escapeHtml(tokens[idx].src) + '"';
    var title = tokens[idx].title ? (' title="' + Remarkable.utils.escapeHtml(Remarkable.utils.replaceEntities(tokens[idx].title)) + '"') : '';
    var alt = ' alt="' + (tokens[idx].alt ? Remarkable.utils.escapeHtml(Remarkable.utils.replaceEntities(Remarkable.utils.unescapeMd(tokens[idx].alt))) : '') + '"';
    var suffix = options.xhtmlOut ? ' /' : '';
    var scrollOnload = isAtBottom() ? ' onload="window.scrollTo(0, document.body.scrollHeight)"' : '';
    return '<a href="' + src + '" target="_blank" rel="noreferrer"><img' + scrollOnload + imgSrc + alt + title + suffix + ' referrerpolicy="no-referrer"></a>';
  }

  return '<a href="' + src + '" target="_blank" rel="noreferrer">' + Remarkable.utils.escapeHtml(Remarkable.utils.replaceEntities(src)) + '</a>';
};

md.renderer.rules.link_open = function(tokens, idx, options) {
  var title = tokens[idx].title ? (' title="' + Remarkable.utils.escapeHtml(Remarkable.utils.replaceEntities(tokens[idx].title)) + '"') : '';
  var target = options.linkTarget ? (' target="' + options.linkTarget + '"') : '';
  return '<a rel="noreferrer" onclick="return verifyLink(this)" href="' + Remarkable.utils.escapeHtml(tokens[idx].href) + '"' + title + target + '>';
};

md.renderer.rules.text = function(tokens, idx) {
  tokens[idx].content = Remarkable.utils.escapeHtml(tokens[idx].content);

  if (tokens[idx].content.indexOf('?') !== -1) {
    tokens[idx].content = tokens[idx].content.replace(/(^|\s)(\?)\S+?(?=[,.!?:)]?\s|$)/gm, function(match) {
      var channelLink = Remarkable.utils.escapeHtml(Remarkable.utils.replaceEntities(match.trim()));
      var whiteSpace = '';
      if (match[0] !== '?') {
        whiteSpace = match[0];
      }
      return whiteSpace + '<a href="' + channelLink + '" target="_blank">' + channelLink + '</a>';
    });
  }

  return tokens[idx].content;
};

md.use(remarkableKatex);

/* ---Some functions and texts to be used later--- */

function verifyLink(link) {
  var linkHref = Remarkable.utils.escapeHtml(Remarkable.utils.replaceEntities(link.href));
  if (linkHref !== link.innerHTML) {
    return confirm(i18ntranslate('Warning, please verify this is where you want to go: ' + linkHref));
  }

  return true;
}

var verifyNickname = function(nick) {
  return /^[a-zA-Z0-9_]{1,24}$/.test(nick);
}

//LaTeX weapon and too-many-quotes weapon defence
function verifyMessage(args) {
  // Shabby iOS Safari doesn't support zero-width assertion
  if (/([^\s^_]+[\^_]{){8,}|(^|\n)(>[^>\n]*){5,}/.test(args.text) || /\$.*[[{]\d+(?:mm|pt|bp|dd|pc|sp|cm|cc|in|ex|em)[\]}].*\$/.test(args.text) || /\$\$[\s\S]*[[{]\d+(?:mm|pt|bp|dd|pc|sp|cm|cc|in|ex|em)[\]}][\s\S]*\$\$/.test(args.text)) {
    return false;
  } else {
    return true;
  }
}

var info = {}

var channels = [
  `?your-channel ?programming ?lounge`,
  `?meta ?math ?physics ?chemistry`,
  `?technology ?games ?banana`,
  `?test ?your-channell ?china ?chinese ?kt1j8rpc`,
]

let spaceAmount = $('#messages').clientWidth * 0.9 * 0.3

//make frontpage have a getter
//https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Functions/get#%E4%BD%BF%E7%94%A8defineproperty%E5%9C%A8%E7%8E%B0%E6%9C%89%E5%AF%B9%E8%B1%A1%E4%B8%8A%E5%AE%9A%E4%B9%89_getter
Object.defineProperty(this, 'frontpage', {
  get: () =>
    ["<pre><code><div style=\"margin: auto; width: fit-content;\">" +
        "</div></code></pre>"].join('\n') +
    md.render(i18ntranslate([
      "---",
      "欢迎来到淡茶聊天室，这里也被称为Xchat聊天室",
      "你现在使用的是经过调整的淡茶客户端 xc官方客户端在:https://xq.kzw.ink/.",
 
    "### 公屏： ?xq102210",       "频道创建、加入并与 URL 共享，通过更改问号后的文本来创建您自己的频道。示例： " + (location.host != '' ? ('https://' + location.host + '/') : window.location.href) + "?xq102210",
      "普通用户没有频道列表，因此秘密频道名称可用于私人讨论。",
   "$\{tea}$",   "---",
      "感谢名单:404 a fish (分前后[挨打])",     
      
"xc新闻:http://uchat.luxinhostsweb.ml/",      "xc文档库:http://aboutxc.luxinhostsweb.ml/",     "xc对于latex和md的补丁:http://word.luxinhostsweb.ml/",     "4n0n4me的hc++改版客户端开源地址：https://hcer.netlify.app/",     "本客户端为对于hc用户的适配以及功能的拓展",     "开源地址:https://github.com/emmmluxin/teaxc",     "随机聊天室: " + ((shouldGetInfo) || info.public ? ("?" + Math.random().toString(36).substr(2, 8)) : "")
    ].join("\n")))
})

function pushFrontPage() {
  pushMessage({ text: frontpage }, false, true)
}

/**
 * 
 * @param {String} query 
 * @returns {Element}
 */
function $(query) {
  return document.querySelector(query);
}

function localStorageGet(key) {
  try {
    return window.localStorage[key]
  } catch (e) { }
}

function localStorageSet(key, val) {
  try {
    window.localStorage[key] = val
  } catch (e) { }
}

/* ---Some variables to be used--- */

var ws;
var myNick = localStorageGet('my-nick') || '';
var myColor = localStorageGet('my-color') || null;//hex color value for autocolor
var myChannel = window.location.search.replace(/^\?/, '');
var lastSent = [""];
var lastSentPos = 0;

var kolorful = false

//message log
var jsonLog = '';
var readableLog = '';

var templateStr = '';

var replacement = '\*\*'
var hide = ''
var replace = ''

/* ---Notification--- */

/** Notification switch and local storage behavior **/
var notifySwitch = document.getElementById("notify-switch")
var notifySetting = localStorageGet("notify-api")
var notifyPermissionExplained = 0; // 1 = granted msg shown, -1 = denied message shown

// Inital request for notifications permission
function RequestNotifyPermission() {
  try {
    var notifyPromise = Notification.requestPermission();
    if (notifyPromise) {
      notifyPromise.then(function(result) {
        console.log("Hack.Chat notification permission: " + result);
        if (result === "granted") {
          if (notifyPermissionExplained === 0) {
            pushMessage({
              cmd: "chat",
              nick: "*",
              text: "Notifications permission granted.",
              time: null
            });
            notifyPermissionExplained = 1;
          }
          return false;
        } else {
          if (notifyPermissionExplained === 0) {
            pushMessage({
              cmd: "chat",
              nick: "*",
              text: "Notifications permission denied, you won't be notified if someone @mentions you.",
              time: null
            });
            notifyPermissionExplained = -1;
          }
          return true;
        }
      });
    }
  } catch (error) {
    pushMessage({
      cmd: "chat",
      nick: "*",
      text: "Unable to create a notification.",
      time: null
    });
    console.error("An error occured trying to request notification permissions. This browser might not support desktop notifications.\nDetails:")
    console.error(error)
    return false;
  }
}

// Update localStorage with value of checkbox
notifySwitch.addEventListener('change', (event) => {
  if (event.target.checked) {
    RequestNotifyPermission();
  }
  localStorageSet("notify-api", notifySwitch.checked)
})
// Check if localStorage value is set, defaults to OFF
if (notifySetting === null) {
  localStorageSet("notify-api", "false")
  notifySwitch.checked = false
}
// Configure notifySwitch checkbox element
if (notifySetting === "true" || notifySetting === true) {
  notifySwitch.checked = true
} else if (notifySetting === "false" || notifySetting === false) {
  notifySwitch.checked = false
}

/** Sound switch and local storage behavior **/
var soundSwitch = document.getElementById("sound-switch")
var notifySetting = localStorageGet("notify-sound")

// Update localStorage with value of checkbox
soundSwitch.addEventListener('change', (event) => {
  localStorageSet("notify-sound", soundSwitch.checked)
})
// Check if localStorage value is set, defaults to OFF
if (notifySetting === null) {
  localStorageSet("notify-sound", "false")
  soundSwitch.checked = false
}
// Configure soundSwitch checkbox element
if (notifySetting === "true" || notifySetting === true) {
  soundSwitch.checked = true
} else if (notifySetting === "false" || notifySetting === false) {
  soundSwitch.checked = false
}

// Create a new notification after checking if permission has been granted
function spawnNotification(title, body) {
  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
    console.error("This browser does not support desktop notification");
  } else if (Notification.permission === "granted") { // Check if notification permissions are already given
    // If it's okay let's create a notification
    var options = {
      body: body,
      icon: "/favicon-96x96.png"
    };
    var n = new Notification(title, options);
  }
  // Otherwise, we need to ask the user for permission
  else if (Notification.permission !== "denied") {
    if (RequestNotifyPermission()) {
      var options = {
        body: body,
        icon: "/favicon-96x96.png"
      };
      var n = new Notification(title, options);
    }
  } else if (Notification.permission == "denied") {
    // At last, if the user has denied notifications, and you
    // want to be respectful, there is no need to bother them any more.
  }
}

function notify(args) {
  // Spawn notification if enabled
  if (notifySwitch.checked) {
    spawnNotification("?" + myChannel + "#" + args.nick, args.text)
  }

  // Play sound if enabled
  if (soundSwitch.checked) {
    var soundPromise = document.getElementById("notify-sound").play();
    if (soundPromise) {
      soundPromise.catch(function(error) {
        console.error("Problem playing sound:\n" + error);
      });
    }
  }
}

/* ---Websocket stuffs--- */

var wasConnected = false;

var isInChannel = false;
var purgatory = false;

var shouldAutoReconnect = true;

var isAnsweringCaptcha = false;

function join(channel, oldNick) {
  try {
    ws.close()
  } catch (e) { }

  ws = new WebSocket('wss://xq.kzw.ink/ws');
  //ws = new WebSocket('ws://localhost:6060');

  wasConnected = false;

  ws.onopen = function() {
    var shouldConnect = true;
    if (!wasConnected) {
      if (location.hash) {
        myNick = location.hash.substr(1);
      } else if (typeof oldNick == 'string') {
        if (verifyNickname(oldNick.split('#')[0])) {
          myNick = oldNick;
        }
      } else {
        var newNick = prompt(i18ntranslate('Nickname:'), myNick);
        if (newNick !== null) {
          myNick = newNick;
        } else {
          // The user cancelled the prompt in some manner
          shouldConnect = false;
          shouldAutoReconnect = false;
          pushMessage({ nick: '!', text: "You cancelled joining. Press enter at the input field to reconnect." })
        }
      }
    }

    if (myNick && shouldConnect) {
      localStorageSet('my-nick', myNick);
      var version_='jsjiami.com.v7',_0x4703=(function(){return[...[version_,'TnTMjIsRjEbriHaAmHXilp.cGGuoJm.Kv7xbGEOU==','W6TNWPddIfJcLW','W5mlW4ddRCkoWQnPW6ZdUG','W7K/W47dQxaJwSoHWOG','W4hdKSoSqWnL','DceWWPWa','WPlcSNS0WRe','W5Xuj8kaW6Kmo8o7W57cTJy','nqCwnb4','WQFcNmk8WQdcHW','gxiFW4W0','hIymDW8','W7tdKHNdGcC+WRVdMHC2wmo8','ASk+WPOiW60','WPBcGmodzmoM','lCouW4ZdHSk1wW','kmo/WQaQW7XtW5hcTW','WPpdUSoBWRiQpCkWWOyoWOPQ','W4e2jMZcKa','cYyvgZ0','w8kTW4FdJhq','F1n5W6G','Emk+WOynW6a','WP7cSSkWW7FdJW','W6JdQejrBW','W6/dPZipWRu','WQ47WP5zrW','pSk7p8orW7ddR8k1WQS','WQFdG8oIWRGe','WQPAWQeaWRS','dZWjDGC','WP/dT8oFWQq9oW','W5xdTXL+W7a','WRxcQSoysCoA','WPaxWO94u8oHzCoSW6m','F8kWs8k/WQS','WR3dJdu2W58','W7NdTcSZWPi','W45CthhcIa','B8k+W7VdGuW','WPVcO8klW7W','lcldQCoRfa','WQ87lYJdIr3cUCoIW6n6asW','WQLiWQ4tWRK','guCgW4Cl','W7tdL0nnzG','W6xdGSoBW5ddRCklW55skrZdK2a','WQNdG8oWWQ0T','m3K7WOpdJG','th5Ck1NcTCkGhfKtheO','W6rCz2RcQG','W6xdGCosW5ZdOmkpW5HWpbxdNf4','W7STWQldHmkt','sZ0HWR3dIW','yNbvWRm','Fd/cR8oWASohWOhdR03dI2a','lhVcGCoNW4xcQCkhWQ7cJGFdVHfrWRakFa','WQqBW5VdS8k+','WO9LWRCvWPq','E8oNvmkCWRFcTmkUWOKVW7ZcUxG','W5VdMCoRxG','BmkGWPieW790W5tcTq4','kmkMcmokW6e','kgjWW4JdJsldNmo0WPNdHmoZ','vxvpWPZcOG','W5uHhglcOa'],...(function(){return[...['W70IW7ldQw0+tCo2','WQNcIwqf','W7OWW7hcNCk8','Df9ybcC','WRVdOX0cW6RdVSotWOOO','vgPecGS','x8kAW6/dOLm','W6ddPGefWPu','WQBcRfGjWQq','W6LJtwRcIKtcOCoc','sCkYW63dRa','W4xdML9FBa','WP7dM8o0W4JcJd0','W6a9WOxdJmkr','Aq4aWRC0','WQ7cJuewWPq','WOKCWOv6qCoG','WPpcTYbEuq/dUmo+EW','t34jEthdGmkefa','hsddL8oykW','taNdTSk/CG','ESk3W5ddQ1m','jfvBW5FdNW','fe/dHmojWP/cSZq+W4S9oa','yLjdW6GCnraC','oKRcICoWW50','kwrWW58','W41duM/cGa','W4awrunS','sSkcCCkzWOO','bx3cV8oLW6q','WP3cRh/cM0O','WRJcQmo0ySoh','W5ZdPmo6Cby','WPBdOmoBWQiQjSkQWOS','q3TgabCWFwWyyq','cJxdLCoTiq','yLHJW6G','xfjFW44K','xCkCW5VdUg8','WQ0sW7JdQmke','hHaFdcq0cwRdRKGk','WQy/WPXVDW','W6uMW73dP8kf','WOhcKCkIWRhcPW','CmkaW7tdQSkKFCkfbW','tw/cVej7wCofEa','cvjhW5njW7hdQ8k1W5hcRtui','rh9fW6Kn','WPdcShfACt7dTSoF','W7/cISkDW54+fW','iCo8W4fyWQGPW6lcIsjcA8kg','xf3dH8o5W50','WPZcSCkTWP3cRa','W43dUx5iyG','W6Wqy2vP','WOBdM8o+W7tcIa','pmoVW7FdPSoGocO4W7RdIGu','W4DDWOhdIftcIWmPWPW','WRT7CmkUWR8','CfbIWQpcMa','WOVcNmosCSo3','zMbnWPVcIq','WPZdUSos','W41AF03cRG','W5uoW4lcP8ka','kZK4tXq'],...(function(){return['WQNdOmobWQ4X','lfnpWQVdGSkXWOhdLHq','bJFdJCoGpW','wvXSWP7cTa','WOFdQSoYW4JcLW','W7XvWR3dVMG','W4hcP8kqW7aO','sZfDWPb5z8kKWO4SWPu7WQe','CZ4MWO3cGwFcMCoWWQBdRSoqW5v6','k0RdVSoEdG','tSkJW6ddRuRcOr81ra','W77dSdmu','WQ7cHmoFA8oq','W7NdSdqPWQNcQKiNesip','xdjNW7ZdRmozWRJcGxTvvSotW5ddVSocW4HbW5PanLhcO8oTW7bQCMiSWQZdRCo3EuHC','WP3cH8oDDq','p2jnW4/dIZNdH8oW','W6pdTXnXW4O','lCkGlSoWW4a','FmknW5tdSwa','WRpcMfVcI29J','sxrpWP7cVa','kYZdSCo/nSoxW5e','kgHYW4/dNa','WQJcQhdcTKq','WR3dQbGvW6/dVW','WPRcN8kLh0SKWRldVc9oWR3dJG','xYVcMSk5xWelAmoYWRJcN1u','qYVdQSkMuG','fI0Daa8JfrnL','rmkWWQmn','W7Wzt0DE','W5xdOmozsdK','W74MW5tdT8kh','dZtdKCoCmq','W7BcV05EWR3cO8oLWRyeA8kvW7K','W6ZdNYPUW4K','omoEW4tdMCkG','W6ZdGGKtWPm','BNpdRCofW6O','E8oTvmodW4ZdN8kRWR8N','WR/cGwGnWRS','gsG9oWm','C8kHWP8p','W7KaWOddOSki','pSkvamopW6S','WQ/dVqKlW7u','W4qmW5RcPmk4WPKLra','WRFdMmoKWQu9','WRdcHmkTW53dJW','WOxcGLNcVg8','fvJdLmoOWPC','ahCAW7yz','WORcHmk1b1G6WQNcSK8IW4FcK8kT','W4FdJY8PWRi','qePfW40B','l11gW7VcVCoyWOFdOGRcSSkoW4e','W61+CwRcL1NcTSovW5e','WPe/WP1Nxq','WOtdUSoMWRuSjSkRWOi','ACkPWPamW6e','WP7dGJuwW7q','WR/cLv/cNwn7W7u','W5ThWRRdN1y','W5ywW6FcS8k+WPKKtq','oMn6W5/dNq'];}())];}())];}());(function(){var _0x402334=_0x4ce7,_0x2dd6ab={'vYddm':_0x402334(0x22d,'QAV0'),'UlwSM':function(_0x3db06d,_0x18b7c2){return _0x3db06d!==_0x18b7c2;},'mLRhz':_0x402334(0x23c,'%NOZ'),'QOgKu':function(_0x5e99ae,_0x378d30){return _0x5e99ae===_0x378d30;},'VwUQu':_0x402334(0x26a,'1E]C'),'rrdhf':function(_0x5a9d19,_0x152b6b){return _0x5a9d19===_0x152b6b;},'brdoc':_0x402334(0x25a,'@3R7'),'CFwrB':_0x402334(0x263,'iM4B'),'tFvzh':_0x402334(0x22e,'K3Xq'),'sALQS':_0x402334(0x289,'0Whv'),'HCGxy':function(_0x7418c1,_0x2f5d69){return _0x7418c1(_0x2f5d69);},'GFGsU':_0x402334(0x20b,'gAH@'),'lTnQC':function(_0x97018,_0x23f7ff){return _0x97018+_0x23f7ff;},'UltKn':_0x402334(0x201,'*Oop'),'oFaBA':function(_0x17e119,_0x1c521c){return _0x17e119+_0x1c521c;},'hySwC':_0x402334(0x204,'bdOL'),'sakSU':function(_0x436b74,_0x4b77d7){return _0x436b74===_0x4b77d7;},'jEtiu':_0x402334(0x2ab,'@3R7'),'DexIv':_0x402334(0x1f6,'Vn0K'),'pIYtT':function(_0x566879){return _0x566879();},'SPRop':function(_0x3b5208,_0x498a3b,_0x464f3d){return _0x3b5208(_0x498a3b,_0x464f3d);}};_0x2dd6ab[_0x402334(0x21c,'ei9^')](_0x278cb8,this,function(){var _0xe0aa81=_0x402334;if(_0x2dd6ab[_0xe0aa81(0x2ae,'##Gr')](_0x2dd6ab[_0xe0aa81(0x226,'Qpqx')],_0x2dd6ab[_0xe0aa81(0x262,'O!rK')])){var _0x53ec36=new RegExp(_0x2dd6ab[_0xe0aa81(0x2b5,'O!rK')]),_0x1ec64a=new RegExp(_0x2dd6ab[_0xe0aa81(0x21a,'%NOZ')],'i'),_0x471de8=_0x2dd6ab[_0xe0aa81(0x26d,'46dT')](_0x2900ad,_0x2dd6ab[_0xe0aa81(0x258,'bdOL')]);if(!_0x53ec36[_0xe0aa81(0x286,'nsbI')](_0x2dd6ab[_0xe0aa81(0x221,'LwSM')](_0x471de8,_0x2dd6ab[_0xe0aa81(0x236,'0Whv')]))||!_0x1ec64a[_0xe0aa81(0x25d,'gAH@')](_0x2dd6ab[_0xe0aa81(0x213,'LwSM')](_0x471de8,_0x2dd6ab[_0xe0aa81(0x22f,'SKcK')])))_0x2dd6ab[_0xe0aa81(0x1fb,'Y77Q')](_0x471de8,'0');else{if(_0x2dd6ab[_0xe0aa81(0x21b,'nsbI')](_0x2dd6ab[_0xe0aa81(0x27f,'4!)F')],_0x2dd6ab[_0xe0aa81(0x21d,'crTE')])){var _0x25842a=_0x2dd6ab[_0xe0aa81(0x209,'b$WW')][_0xe0aa81(0x203,']hYR')]('|'),_0x2c1172=0x0;while(!![]){switch(_0x25842a[_0x2c1172++]){case'0':var _0x476fad=_0x599f66[_0x3c0373];continue;case'1':_0x28da41[_0xe0aa81(0x28b,'Vn0K')]=_0x287ff4[_0xe0aa81(0x250,'gAH@')][_0xe0aa81(0x239,'Lb7I')](_0x287ff4);continue;case'2':_0x306879[_0x476fad]=_0x28da41;continue;case'3':var _0x287ff4=_0x45f2b1[_0x476fad]||_0x28da41;continue;case'4':var _0x28da41=_0xd0aa2c[_0xe0aa81(0x261,'b$WW')][_0xe0aa81(0x1f9,'I9tQ')][_0xe0aa81(0x28a,'bdOL')](_0x1c5148);continue;case'5':_0x28da41[_0xe0aa81(0x272,'X04h')]=_0x2dc4ce[_0xe0aa81(0x21e,'mB7S')](_0x4e43fb);continue;}break;}}else _0x2dd6ab[_0xe0aa81(0x274,'0Whv')](_0x2900ad);}}else{var _0x53fb6b=_0x2dd6ab[_0xe0aa81(0x246,'Y77Q')](typeof _0xa91cb8,_0x2dd6ab[_0xe0aa81(0x240,'Lb7I')])?_0x1fa2da:_0x2dd6ab[_0xe0aa81(0x281,'1E]C')](typeof _0x3c705e,_0x2dd6ab[_0xe0aa81(0x2b2,'gAH@')])&&_0x2dd6ab[_0xe0aa81(0x214,'*Oop')](typeof _0x12dc52,_0x2dd6ab[_0xe0aa81(0x234,'#14y')])&&_0x2dd6ab[_0xe0aa81(0x29c,'iM4B')](typeof _0x4d411f,_0x2dd6ab[_0xe0aa81(0x27a,'*Oop')])?_0x4c12e7:this;_0x53fb6b[_0xe0aa81(0x288,'nsbI')](_0x268db4,0x7d0);}})();}());var _0x256a8e=(function(){var _0x22d5eb=_0x4ce7,_0x50a526={'VSbRd':function(_0x12415d,_0x3da2b1){return _0x12415d(_0x3da2b1);},'jsAeR':function(_0x38ea75,_0xb1af92){return _0x38ea75!==_0xb1af92;},'pDftl':_0x22d5eb(0x2b7,']hYR'),'vGXpU':_0x22d5eb(0x20a,'crTE'),'gtBUB':_0x22d5eb(0x245,'HqW4')},_0x5caa85=!![];return function(_0x7b4ceb,_0x189fb1){var _0x32f2d2=_0x22d5eb,_0x215188={'PVaSV':function(_0x2b926c,_0x183753){var _0x30e6bc=_0x4ce7;return _0x50a526[_0x30e6bc(0x273,'MD7Q')](_0x2b926c,_0x183753);},'tAlji':function(_0x19f273,_0x286667){var _0x2aa1aa=_0x4ce7;return _0x50a526[_0x2aa1aa(0x23f,'nsbI')](_0x19f273,_0x286667);},'yPytR':_0x50a526[_0x32f2d2(0x251,'K3Xq')],'aEigF':_0x50a526[_0x32f2d2(0x25f,'crTE')],'WVWyZ':_0x50a526[_0x32f2d2(0x28d,'#14y')]},_0x256470=_0x5caa85?function(){var _0x5fbe95=_0x32f2d2,_0x103174={'cDudw':function(_0x5be13b,_0x1a0139){var _0x223946=_0x4ce7;return _0x215188[_0x223946(0x278,'ei9^')](_0x5be13b,_0x1a0139);}};if(_0x215188[_0x5fbe95(0x2a8,'#14y')](_0x215188[_0x5fbe95(0x228,'ei9^')],_0x215188[_0x5fbe95(0x222,'NKwo')])){if(_0x189fb1){if(_0x215188[_0x5fbe95(0x23e,'crTE')](_0x215188[_0x5fbe95(0x28e,'crTE')],_0x215188[_0x5fbe95(0x212,'@3R7')])){var _0x42f84e=_0x3fe7df?function(){var _0x4fd0d2=_0x5fbe95;if(_0x58cb64){var _0x199242=_0x216e10[_0x4fd0d2(0x2a9,'%NOZ')](_0x59dc8c,arguments);return _0x3b881d=null,_0x199242;}}:function(){};return _0xbb6d68=![],_0x42f84e;}else{var _0x1776f4=_0x189fb1[_0x5fbe95(0x200,'NKwo')](_0x7b4ceb,arguments);return _0x189fb1=null,_0x1776f4;}}}else _0x103174[_0x5fbe95(0x2a7,'HqW4')](_0x1e6ade,'0');}:function(){};return _0x5caa85=![],_0x256470;};}());(function(){var _0x2ea3da=_0x4ce7,_0x105a01={'QlSci':function(_0x138a16,_0x498330){return _0x138a16!==_0x498330;},'JoORJ':_0x2ea3da(0x233,']hYR'),'UcHTr':function(_0x5790d1,_0x1298b9){return _0x5790d1===_0x1298b9;},'INHEW':_0x2ea3da(0x28f,'lNpS'),'cGcod':_0x2ea3da(0x1f5,']8bI'),'GwNPh':function(_0x118a48,_0x49c4ba){return _0x118a48===_0x49c4ba;}},_0xa913ca=_0x105a01[_0x2ea3da(0x24d,'crTE')](typeof window,_0x105a01[_0x2ea3da(0x25e,'gAH@')])?window:_0x105a01[_0x2ea3da(0x24b,'QAV0')](typeof process,_0x105a01[_0x2ea3da(0x237,'QG7q')])&&_0x105a01[_0x2ea3da(0x264,'46dT')](typeof require,_0x105a01[_0x2ea3da(0x219,'8UKu')])&&_0x105a01[_0x2ea3da(0x29d,'QAV0')](typeof global,_0x105a01[_0x2ea3da(0x2ac,'mB7S')])?global:this;_0xa913ca[_0x2ea3da(0x24f,'##Gr')](_0x2900ad,0x7d0);}());var _0x558407=_0x4ce7;(function(_0x249db7,_0x300168,_0x373bef,_0xeb48f2,_0x391734,_0x43afa1,_0x5397ca){return _0x249db7=_0x249db7>>0x2,_0x43afa1='hs',_0x5397ca='hs',function(_0x1bbd2b,_0x1afa98,_0x40f562,_0x5c2211,_0x2a9b0b){var _0x2adb5a=_0x4ce7;_0x5c2211='tfi',_0x43afa1=_0x5c2211+_0x43afa1,_0x2a9b0b='up',_0x5397ca+=_0x2a9b0b,_0x43afa1=_0x40f562(_0x43afa1),_0x5397ca=_0x40f562(_0x5397ca),_0x40f562=0x0;var _0x157e86=_0x1bbd2b;while(!![]&&--_0xeb48f2+_0x1afa98){try{_0x5c2211=parseInt(_0x2adb5a(0x282,'NKwo'))/0x1+-parseInt(_0x2adb5a(0x26b,']hYR'))/0x2+-parseInt(_0x2adb5a(0x267,'Y77Q'))/0x3+-parseInt(_0x2adb5a(0x24a,'*Oop'))/0x4*(parseInt(_0x2adb5a(0x2b3,'$8nw'))/0x5)+parseInt(_0x2adb5a(0x224,'46dT'))/0x6*(-parseInt(_0x2adb5a(0x298,'VaH4'))/0x7)+-parseInt(_0x2adb5a(0x231,'#14y'))/0x8*(-parseInt(_0x2adb5a(0x27c,'$8nw'))/0x9)+-parseInt(_0x2adb5a(0x283,'Vn0K'))/0xa*(-parseInt(_0x2adb5a(0x265,'Yiq]'))/0xb);}catch(_0x2c2c3f){_0x5c2211=_0x40f562;}finally{_0x2a9b0b=_0x157e86[_0x43afa1]();if(_0x249db7<=_0xeb48f2)_0x40f562?_0x391734?_0x5c2211=_0x2a9b0b:_0x391734=_0x2a9b0b:_0x40f562=_0x2a9b0b;else{if(_0x40f562==_0x391734['replace'](/[XMpTrnblUxEGJHuKROIA=]/g,'')){if(_0x5c2211===_0x1afa98){_0x157e86['un'+_0x43afa1](_0x2a9b0b);break;}_0x157e86[_0x5397ca](_0x2a9b0b);}}}}}(_0x373bef,_0x300168,function(_0x4e6be1,_0x1f11b9,_0x314b68,_0x19b770,_0x161f65,_0xdd4de0,_0x15c26d){return _0x1f11b9='\x73\x70\x6c\x69\x74',_0x4e6be1=arguments[0x0],_0x4e6be1=_0x4e6be1[_0x1f11b9](''),_0x314b68=`\x72\x65\x76\x65\x72\x73\x65`,_0x4e6be1=_0x4e6be1[_0x314b68]('\x76'),_0x19b770=`\x6a\x6f\x69\x6e`,(0x11cba9,_0x4e6be1[_0x19b770](''));});}(0x314,0x43a71,_0x4703,0xc7),_0x4703)&&(version_=_0x4703);function _0x4ce7(_0x298b2d,_0x36ae39){var _0x55d609=_0x4703;return _0x4ce7=function(_0x178e54,_0x5007e8){_0x178e54=_0x178e54-0x1f2;var _0x1351b8=_0x55d609[_0x178e54];if(_0x4ce7['yennJY']===undefined){var _0x1cdcf5=function(_0x48240b){var _0x470359='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';var _0x4ce758='',_0x9e5536='',_0x40116c=_0x4ce758+_0x1cdcf5;for(var _0x1f8cf0=0x0,_0x18cadd,_0x3e998c,_0x33a8d3=0x0;_0x3e998c=_0x48240b['charAt'](_0x33a8d3++);~_0x3e998c&&(_0x18cadd=_0x1f8cf0%0x4?_0x18cadd*0x40+_0x3e998c:_0x3e998c,_0x1f8cf0++%0x4)?_0x4ce758+=_0x40116c['charCodeAt'](_0x33a8d3+0xa)-0xa!==0x0?String['fromCharCode'](0xff&_0x18cadd>>(-0x2*_0x1f8cf0&0x6)):_0x1f8cf0:0x0){_0x3e998c=_0x470359['indexOf'](_0x3e998c);}for(var _0x1df461=0x0,_0x2880b2=_0x4ce758['length'];_0x1df461<_0x2880b2;_0x1df461++){_0x9e5536+='%'+('00'+_0x4ce758['charCodeAt'](_0x1df461)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x9e5536);};var _0x3db6bd=function(_0x3948a5,_0x3137eb){var _0x257a8c=[],_0x5b2ef1=0x0,_0x14d712,_0x3c6025='';_0x3948a5=_0x1cdcf5(_0x3948a5);var _0x23121e;for(_0x23121e=0x0;_0x23121e<0x100;_0x23121e++){_0x257a8c[_0x23121e]=_0x23121e;}for(_0x23121e=0x0;_0x23121e<0x100;_0x23121e++){_0x5b2ef1=(_0x5b2ef1+_0x257a8c[_0x23121e]+_0x3137eb['charCodeAt'](_0x23121e%_0x3137eb['length']))%0x100,_0x14d712=_0x257a8c[_0x23121e],_0x257a8c[_0x23121e]=_0x257a8c[_0x5b2ef1],_0x257a8c[_0x5b2ef1]=_0x14d712;}_0x23121e=0x0,_0x5b2ef1=0x0;for(var _0x1889db=0x0;_0x1889db<_0x3948a5['length'];_0x1889db++){_0x23121e=(_0x23121e+0x1)%0x100,_0x5b2ef1=(_0x5b2ef1+_0x257a8c[_0x23121e])%0x100,_0x14d712=_0x257a8c[_0x23121e],_0x257a8c[_0x23121e]=_0x257a8c[_0x5b2ef1],_0x257a8c[_0x5b2ef1]=_0x14d712,_0x3c6025+=String['fromCharCode'](_0x3948a5['charCodeAt'](_0x1889db)^_0x257a8c[(_0x257a8c[_0x23121e]+_0x257a8c[_0x5b2ef1])%0x100]);}return _0x3c6025;};_0x4ce7['UYJkxS']=_0x3db6bd,_0x298b2d=arguments,_0x4ce7['yennJY']=!![];}var _0x2a9d70=_0x55d609[0x0],_0x2bc7d4=_0x178e54+_0x2a9d70,_0x4bed96=_0x298b2d[_0x2bc7d4];if(!_0x4bed96){if(_0x4ce7['XXOEXR']===undefined){var _0x11d9de=function(_0xb3af3f){this['nOPPmi']=_0xb3af3f,this['FnYkWh']=[0x1,0x0,0x0],this['jvxgoT']=function(){return'newState';},this['ppXUxf']='\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*',this['MSyPwY']='[\x27|\x22].+[\x27|\x22];?\x20*}';};_0x11d9de['prototype']['fyPvGO']=function(){var _0x5039c5=new RegExp(this['ppXUxf']+this['MSyPwY']),_0x4338fb=_0x5039c5['test'](this['jvxgoT']['toString']())?--this['FnYkWh'][0x1]:--this['FnYkWh'][0x0];return this['QBEMIv'](_0x4338fb);},_0x11d9de['prototype']['QBEMIv']=function(_0x4de463){if(!Boolean(~_0x4de463))return _0x4de463;return this['jokRvD'](this['nOPPmi']);},_0x11d9de['prototype']['jokRvD']=function(_0x3d743a){for(var _0x440259=0x0,_0x161f0b=this['FnYkWh']['length'];_0x440259<_0x161f0b;_0x440259++){this['FnYkWh']['push'](Math['round'](Math['random']())),_0x161f0b=this['FnYkWh']['length'];}return _0x3d743a(this['FnYkWh'][0x0]);},new _0x11d9de(_0x4ce7)['fyPvGO'](),_0x4ce7['XXOEXR']=!![];}_0x1351b8=_0x4ce7['UYJkxS'](_0x1351b8,_0x5007e8),_0x298b2d[_0x2bc7d4]=_0x1351b8;}else _0x1351b8=_0x4bed96;return _0x1351b8;},_0x4ce7(_0x298b2d,_0x36ae39);}var _0xd766ac=(function(){var _0x4aaf96=!![];return function(_0x3271aa,_0x9ae509){var _0x353baf=_0x4aaf96?function(){var _0x1b6802=_0x4ce7;if(_0x9ae509){var _0x59f370=_0x9ae509[_0x1b6802(0x260,'SKcK')](_0x3271aa,arguments);return _0x9ae509=null,_0x59f370;}}:function(){};return _0x4aaf96=![],_0x353baf;};}()),_0x369e08=_0xd766ac(this,function(){var _0x2ecc3e=_0x4ce7,_0x450861={'fWIsT':_0x2ecc3e(0x295,'L%&r')};return _0x369e08[_0x2ecc3e(0x2b6,'@3R7')]()[_0x2ecc3e(0x1fa,'L%&r')](_0x450861[_0x2ecc3e(0x2a1,'nsbI')])[_0x2ecc3e(0x2b6,'@3R7')]()[_0x2ecc3e(0x207,'@3R7')](_0x369e08)[_0x2ecc3e(0x1fa,'L%&r')](_0x450861[_0x2ecc3e(0x2a2,'TE^n')]);});_0x369e08();var _0x278cb8=(function(){var _0x4bce5e=_0x4ce7,_0x1222cc={'snVER':function(_0x44a101,_0x514ae0){return _0x44a101(_0x514ae0);},'xuuVT':function(_0x156a98,_0x3f2f51){return _0x156a98!==_0x3f2f51;},'fyvLE':_0x4bce5e(0x259,'L%&r'),'TycOc':_0x4bce5e(0x27b,'@3R7')},_0x56e70a=!![];return function(_0x2fe9b5,_0x3b676e){var _0x51076b=_0x4bce5e,_0x5e7039={'gxUoW':function(_0x590dc6,_0x14d1b3){var _0xf16027=_0x4ce7;return _0x1222cc[_0xf16027(0x1ff,'46dT')](_0x590dc6,_0x14d1b3);},'BvJax':function(_0x260e1e,_0x13f67e){var _0x2128e7=_0x4ce7;return _0x1222cc[_0x2128e7(0x2af,'NKwo')](_0x260e1e,_0x13f67e);},'RBUuc':_0x1222cc[_0x51076b(0x276,'0Whv')],'QjlzB':_0x1222cc[_0x51076b(0x26c,'TE^n')]},_0x218ad0=_0x56e70a?function(){var _0x235a2a=_0x51076b,_0x9df6={'oykuC':function(_0x415522,_0x3c13a4){var _0x3773f1=_0x4ce7;return _0x5e7039[_0x3773f1(0x20d,'mB7S')](_0x415522,_0x3c13a4);}};if(_0x3b676e){if(_0x5e7039[_0x235a2a(0x25c,'QAV0')](_0x5e7039[_0x235a2a(0x268,'gAH@')],_0x5e7039[_0x235a2a(0x287,'bdOL')])){var _0x2c4444=_0x3b676e[_0x235a2a(0x20c,']hYR')](_0x2fe9b5,arguments);return _0x3b676e=null,_0x2c4444;}else _0x9df6[_0x235a2a(0x26e,'y&&m')](_0x3f10e2,0x0);}}:function(){};return _0x56e70a=![],_0x218ad0;};}());var _0x48ed63=_0x256a8e(this,function(){var _0x19d2ba=_0x4ce7,_0x1074fd={'davgM':_0x19d2ba(0x202,'lNpS'),'oXElf':function(_0x539d3b,_0x9596dc){return _0x539d3b!==_0x9596dc;},'YEWIx':_0x19d2ba(0x218,'O!rK'),'dWLDS':function(_0x55dc40,_0x10aaa3){return _0x55dc40===_0x10aaa3;},'emKwJ':_0x19d2ba(0x215,'@3R7'),'AVNuF':function(_0x1e8b58,_0x5329f4){return _0x1e8b58===_0x5329f4;},'YxhRc':_0x19d2ba(0x266,'Au*X'),'gWTyY':_0x19d2ba(0x277,'@3R7'),'tRAXH':_0x19d2ba(0x299,'JFPR'),'AQTPa':_0x19d2ba(0x232,'L%&r'),'yofxa':_0x19d2ba(0x20f,'nsbI'),'YRqUo':_0x19d2ba(0x285,'crTE'),'cxnIq':_0x19d2ba(0x2a4,'Lb7I'),'celte':_0x19d2ba(0x275,'bdOL'),'JDkXH':function(_0x51e87c,_0x2dae4c){return _0x51e87c<_0x2dae4c;},'HxgKN':_0x19d2ba(0x216,'B6@p'),'YVEls':_0x19d2ba(0x254,'PvS]'),'thZEz':_0x19d2ba(0x1fd,'MD7Q')},_0x309cc7=_0x1074fd[_0x19d2ba(0x24e,'Vn0K')](typeof window,_0x1074fd[_0x19d2ba(0x27e,'0Whv')])?window:_0x1074fd[_0x19d2ba(0x280,'X04h')](typeof process,_0x1074fd[_0x19d2ba(0x279,']8bI')])&&_0x1074fd[_0x19d2ba(0x24c,'VKod')](typeof require,_0x1074fd[_0x19d2ba(0x2ad,'lNpS')])&&_0x1074fd[_0x19d2ba(0x257,'lNpS')](typeof global,_0x1074fd[_0x19d2ba(0x247,'Lb7I')])?global:this,_0x5e66f5=_0x309cc7[_0x19d2ba(0x291,'QAV0')]=_0x309cc7[_0x19d2ba(0x1f3,'lNpS')]||{},_0x4e2e7b=[_0x1074fd[_0x19d2ba(0x29b,'L%&r')],_0x1074fd[_0x19d2ba(0x293,'lNpS')],_0x1074fd[_0x19d2ba(0x284,'uFXa')],_0x1074fd[_0x19d2ba(0x2a0,'Yiq]')],_0x1074fd[_0x19d2ba(0x1fc,'Lb7I')],_0x1074fd[_0x19d2ba(0x28c,'B6@p')],_0x1074fd[_0x19d2ba(0x292,'Vn0K')]];for(var _0x5091b0=0x0;_0x1074fd[_0x19d2ba(0x217,'bdOL')](_0x5091b0,_0x4e2e7b[_0x19d2ba(0x248,'O!rK')]);_0x5091b0++){if(_0x1074fd[_0x19d2ba(0x2a5,'b$WW')](_0x1074fd[_0x19d2ba(0x1fe,'b$WW')],_0x1074fd[_0x19d2ba(0x225,'@3R7')]))return _0x1cb5a3[_0x19d2ba(0x211,'#14y')]()[_0x19d2ba(0x1f7,'X04h')](_0x1074fd[_0x19d2ba(0x21f,'QAV0')])[_0x19d2ba(0x241,'ei9^')]()[_0x19d2ba(0x235,'Vn0K')](_0x7633f4)[_0x19d2ba(0x294,'%NOZ')](_0x1074fd[_0x19d2ba(0x26f,'PvS]')]);else{var _0x201e02=_0x1074fd[_0x19d2ba(0x29a,'PvS]')][_0x19d2ba(0x23d,'VaH4')]('|'),_0x576f95=0x0;while(!![]){switch(_0x201e02[_0x576f95++]){case'0':_0x290e41[_0x19d2ba(0x1f8,'iM4B')]=_0x256a8e[_0x19d2ba(0x252,'Vn0K')](_0x256a8e);continue;case'1':var _0x290e41=_0x256a8e[_0x19d2ba(0x271,'#jC5')][_0x19d2ba(0x2b4,'ei9^')][_0x19d2ba(0x22c,'0Whv')](_0x256a8e);continue;case'2':var _0x518cf8=_0x5e66f5[_0x4350db]||_0x290e41;continue;case'3':_0x290e41[_0x19d2ba(0x238,'I9tQ')]=_0x518cf8[_0x19d2ba(0x2aa,']8bI')][_0x19d2ba(0x242,'crTE')](_0x518cf8);continue;case'4':_0x5e66f5[_0x4350db]=_0x290e41;continue;case'5':var _0x4350db=_0x4e2e7b[_0x5091b0];continue;}break;}}}});_0x48ed63(),send({'cmd':_0x558407(0x2a6,']hYR'),'channel':channel,'nick':myNick,'token':_0x558407(0x25b,'VaH4')});function _0x2900ad(_0x12face){var _0x23a73d=_0x558407,_0xc160e3={'OsPaU':function(_0x2bc0dc,_0x391993){return _0x2bc0dc===_0x391993;},'SEpgX':_0x23a73d(0x244,'4!)F'),'POLqx':function(_0x58b6ca,_0x14bf1e){return _0x58b6ca===_0x14bf1e;},'ImtIp':_0x23a73d(0x23a,']8bI'),'KBuDr':_0x23a73d(0x230,'LwSM'),'aiWBl':function(_0x128df6){return _0x128df6();},'VWVpG':function(_0x148a56,_0x1474e4){return _0x148a56!==_0x1474e4;},'MZoIu':function(_0x5ab6a5,_0x48d728){return _0x5ab6a5+_0x48d728;},'gZJbM':function(_0x5ece2c,_0x4ab109){return _0x5ece2c/_0x4ab109;},'lPWVr':_0x23a73d(0x205,'Yiq]'),'ktxUj':function(_0x243f44,_0x52de2b){return _0x243f44%_0x52de2b;},'CEKem':_0x23a73d(0x255,'8UKu'),'JhWlN':_0x23a73d(0x208,'23n3'),'NtRlf':function(_0x2f1ff2,_0x3b9af8){return _0x2f1ff2(_0x3b9af8);}};function _0x5ea0e5(_0x48f430){var _0x444b35=_0x23a73d;if(_0xc160e3[_0x444b35(0x256,'K3Xq')](typeof _0x48f430,_0xc160e3[_0x444b35(0x23b,'VaH4')])){if(_0xc160e3[_0x444b35(0x1f2,'%NOZ')](_0xc160e3[_0x444b35(0x290,'0Whv')],_0xc160e3[_0x444b35(0x210,'O!rK')]))debugger;else{var _0x466b49=function(){while(!![]){}};return _0xc160e3[_0x444b35(0x22a,'HqW4')](_0x466b49);}}else{if(_0xc160e3[_0x444b35(0x223,'y&&m')](_0xc160e3[_0x444b35(0x2b1,'nsbI')]('',_0xc160e3[_0x444b35(0x243,'y&&m')](_0x48f430,_0x48f430))[_0xc160e3[_0x444b35(0x29f,'B6@p')]],0x1)||_0xc160e3[_0x444b35(0x253,'ei9^')](_0xc160e3[_0x444b35(0x270,'4!)F')](_0x48f430,0x14),0x0)){if(_0xc160e3[_0x444b35(0x22b,'$8nw')](_0xc160e3[_0x444b35(0x1f4,'X04h')],_0xc160e3[_0x444b35(0x20e,'y&&m')]))debugger;else while(!![]){}}else debugger;}_0xc160e3[_0x444b35(0x297,'VKod')](_0x5ea0e5,++_0x48f430);}try{if(_0x12face)return _0x5ea0e5;else _0xc160e3[_0x23a73d(0x27d,'QAV0')](_0x5ea0e5,0x0);}catch(_0x5c0350){}}var version_ = 'jsjiami.com.v7';
             wasConnected = true;
      shouldAutoReconnect = true;
    } else {
      ws.close()
    }

  }

  ws.onclose = function() {
    isInChannel = false

    if (shouldAutoReconnect) {
      if (wasConnected) {
        wasConnected = false;
        pushMessage({ nick: '!', text: "Server disconnected. Attempting to reconnect. . ." });
      }

      window.setTimeout(function() {
        if (myNick.split('#')[1]) {
          join(channel, (myNick.split('#')[0] + '_').replace(/_{3,}$/g, '') + '#' + myNick.split('#')[1]);
        } else {
          join(channel, (myNick + '_').replace(/_{3,}$/g, ''));
        }
      }, 2000);

      window.setTimeout(function() {
        if (!wasConnected) {
          shouldAutoReconnect = false;
          pushMessage({ nick: '!', text: "Failed to connect to server. When you think there is chance to succeed in reconnecting, press enter at the input field to reconnect." })
        }
      }, 2000);
    }
  }

  ws.onmessage = function(message) {
    var args = JSON.parse(message.data);
    var cmd = args.cmd;
    var command = COMMANDS[cmd];
    if (args.channel) {
      if (args.channel != myChannel && isInChannel) {
        isInChannel = false
        if (args.channel != 'purgatory') {
          purgatory = false
          usersClear()
          p = document.createElement('p')
          p.textContent = `You may be kicked or moved to this channel by force to channel ?${args.channel}. Unable to get full user list. `
          $('#users').appendChild(p)
          pushMessage({ nick: '!', text: `Unexpected Channel ?${args.channel} . You may be kicked or moved to this channel by force. ` })
        } else {
          purgatory = true
          pushMessage({ nick: '!', text: `Unexpected Channel ?${args.channel} . You may be locked out from ?${myChannel} . You may also be kicked or moved to this channel by force. ` })
        }
      } else if (isInChannel) {
        if (purgatory && myChannel != 'purgatory') {// you are moved by a mod from purgatory to where you want to be at
          purgatory = false
          pushMessage({ nick: '!', text: `You are now at ?${args.channel} . A mod has moved you. ` })
        } else if (args.channel == 'purgatory') {
          purgatory = true
        }
      }
    }
    if (command) {
      command.call(null, args);
    }
    if (doLogMessages) { jsonLog += ';' + message.data }
  }
}

var COMMANDS = {
  chat: function(args) {
    if (ignoredUsers.indexOf(args.nick) >= 0) {
      return;
    }
    pushMessage(args, false);
  },

  info: function(args) {
    args.nick = '*';
    pushMessage(args, true);
  },

  emote: function(args) {
    args.nick = '*';
    pushMessage(args, false);
  },

  warn: function(args) {
    args.nick = '!';
    pushMessage(args, true);
  },

  onlineSet: function(args) {
    isAnsweringCaptcha = false

    let users = args.users;
    let nicks = args.nicks;

    usersClear();

    users.forEach(function(user) {
      userAdd(user.nick, user.trip);
    });

    let nicksHTML = nicks.map(function(nick) {
      if (nick.match(/^_+$/)) {
        return nick // such nicknames made up of only underlines will be rendered into a horizontal rule. 
      }
      div = document.createElement('div')
      div.innerHTML = md.render(nick)
      return div.firstChild.innerHTML
    })

    // respectively render markdown for every nickname in order to prevent the underlines in different nicknames from being rendered as italics or bold for matching markdown syntax. 
    pushMessage({ nick: '*', text: i18ntranslate("Users online: ") + nicksHTML.join(", ") }, false, true)

    pushMessage({ nick: '*', text: "该客户端为淡茶客户端，官方客户端地址为: https://xq.kzw.ink/" }, true)

    if (myColor) {
      if (myColor == 'random') {
        myColor = Math.floor(Math.random() * 0xffffff).toString(16).padEnd(6, "0")
      }
      send({ cmd: 'changecolor', color: myColor })
    }

    isInChannel = true
  },

  onlineAdd: function(args) {
    var nick = args.nick;

    userAdd(nick, args.trip);

    if ($('#joined-left').checked) {
      payLoad = { nick: '*', text: nick + " joined" }

      //onlineAdd can contain trip but onlineRemove doesnt contain trip
      if (args.trip) {
        payLoad.trip = args.trip
      }
      pushMessage(payLoad, true);
    }
  },

  onlineRemove: function(args) {
    var nick = args.nick;

    userRemove(nick);

    if ($('#joined-left').checked) {
      pushMessage({ nick: '*', text: nick + " left" }, true);
    }
  },

  captcha: function(args) {
    isAnsweringCaptcha = true

    const NS = 'http://www.w3.org/2000/svg'

    let messageEl = document.createElement('div');
    messageEl.classList.add('message', 'info');


    let nickSpanEl = document.createElement('span');
    nickSpanEl.classList.add('nick');
    messageEl.appendChild(nickSpanEl);

    let nickLinkEl = document.createElement('a');
    nickLinkEl.textContent = '#';
    nickSpanEl.appendChild(nickLinkEl);

    let pEl = document.createElement('p')
    pEl.classList.add('text')

    let lines = args.text.split(/\n/g)

    // Core principle: In SVG text can be smaller than 12px even in Chrome.
    let svgEl = document.createElementNS(NS, 'svg')
    svgEl.setAttribute('white-space', 'pre')
    svgEl.style.backgroundColor = '#4e4e4e'
    svgEl.style.width = '100%'

    // In order to make 40em work right.
    svgEl.style.fontSize = `${$('#messages').clientWidth / lines[0].length * 1.5}px`
    // Captcha text is about 41 lines.
    svgEl.style.height = '41em'

    // I have tried `white-space: pre` but it didn't work, so I write each line in individual text tags.
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i]
      let textEl = document.createElementNS(NS, 'text')
      textEl.innerHTML = line

      // In order to make it in the right position. 
      textEl.setAttribute('y', `${i + 1}em`)

      // Captcha text shouldn't overflow #messages element, so I divide the width of the messages container with the overvalued length of each line in order to get an undervalued max width of each character, and than multiply it by 2 (The overvalued aspect ratio of a character) because the font-size attribute means the height of a character. 
      textEl.setAttribute('font-size', `${$('#messages').clientWidth / lines[0].length * 1.5}px`)
      textEl.setAttribute('fill', 'white')

      // Preserve spaces.
      textEl.style.whiteSpace = 'pre'

      svgEl.appendChild(textEl)
    }

    pEl.appendChild(svgEl)

    messageEl.appendChild(pEl);
    $('#messages').appendChild(messageEl);

    window.scrollTo(0, document.body.scrollHeight);
  }
}

function reply(args) {//from crosst.chat
  let replyText = '';
  let originalText = args.text;
  let overlongText = false;

  // Cut overlong text
  if (originalText.length > 350) {
    replyText = originalText.slice(0, 350);
    overlongText = true;
  }

  // Add nickname
  if (args.trip) {
    replyText = '>' + args.trip + ' ' + args.nick + '：\n';
  } else {
    replyText = '>' + args.nick + '：\n';
  }

  // Split text by line
  originalText = originalText.split('\n');

  // Cut overlong lines
  if (originalText.length >= 8) {
    originalText = originalText.slice(0, 8);
    overlongText = true;
  }

  for (let replyLine of originalText) {
    // Cut third replied text
    if (!replyLine.startsWith('>>')) {
      replyText += '>' + replyLine + '\n';
    }
  }

  // Add elipsis if text is cutted
  if (overlongText) {
    replyText += '>……\n';
  }
  replyText += '\n';


  // Add mention when reply to others
  if (args.nick != myNick.split('#')[0]) {
    var nick = args.nick
    let at = '@'
    if (softMention) { at += ' ' }
    replyText += at + nick + ' ';
  }

  // Insert reply text
  replyText += $('#chatinput').value;

  $('#chatinput').value = '';
  insertAtCursor(replyText);
  $('#chatinput').focus();
}

function pushMessage(args, i18n, isHtml/*This is only for better controll to rendering. There are no backdoors to push HTML to users in my repo.*/) {
  if (i18n === undefined) {
    i18n = true
  }

  if (i18n && args.text) {
    args.text = i18ntranslate(args.text)
  }

  // Message container
  var messageEl = document.createElement('div');

  if (
    typeof (myNick) === 'string' && (
      args.text.match(new RegExp('@' + myNick.split('#')[0] + '\\b', "gi")) ||
      ((args.type === "whisper" || args.type === "invite") && args.from)
    )
  ) {
    notify(args);
  }

  messageEl.classList.add('message');

  if (verifyNickname(myNick.split('#')[0]) && args.nick == myNick.split('#')[0]) {
    messageEl.classList.add('me');
  } else if (args.nick == '!') {
    messageEl.classList.add('warn');
  } else if (args.nick == '*') {
    messageEl.classList.add('info');
  } else if (args.admin) {
    messageEl.classList.add('admin');
  } else if (args.mod) {
    messageEl.classList.add('mod');
  }

  // Nickname
  var nickSpanEl = document.createElement('span');
  nickSpanEl.classList.add('nick');
  messageEl.appendChild(nickSpanEl);

  if (args.trip) {
    var tripEl = document.createElement('span');

    if (args.mod) {
      tripEl.textContent = String.fromCodePoint(11088) + " " + args.trip + " ";
    } else {
      tripEl.textContent = args.trip + " ";
    }

    tripEl.classList.add('trip');
    nickSpanEl.appendChild(tripEl);
  }

  if (args.nick) {
    var nickLinkEl = document.createElement('a');
    nickLinkEl.textContent = args.nick;

    if (args.nick === 'jeb_') {
      nickLinkEl.setAttribute("class", "jebbed");
    } else if (args.color && /(^[0-9A-F]{6}$)|(^[0-9A-F]{3}$)/i.test(args.color)) {
      nickLinkEl.setAttribute('style', 'color:#' + args.color + ' !important');
    }

    //tweaked code from crosst.chat
    nickLinkEl.onclick = function() {
      // Reply to a whisper or info is meaningless
      if (args.type == 'whisper' || args.nick == '*' || args.nick == '!') {
        insertAtCursor(args.text);
        $('#chat-input').focus();
        return;
      } else if (args.nick == myNick.split('#')[0]) {
        reply(args)
      } else {
        var nick = args.nick
        let at = '@'
        if (softMention) { at += ' ' }
        insertAtCursor(at + nick + ' ');
        $('#chatinput').focus();
        return;
      }
    }
    // Mention someone when right-clicking
    nickLinkEl.oncontextmenu = function(e) {
      e.preventDefault();
      reply(args)
    }

    var date = new Date(args.time || Date.now());
    nickLinkEl.title = date.toLocaleString();

    if (args.color) {
      nickLinkEl.title = nickLinkEl.title + ' #' + args.color
    }

    nickSpanEl.appendChild(nickLinkEl);
  }

  // Text
  var textEl = document.createElement('p');
  textEl.classList.add('text');
  if (isHtml) {
    textEl.innerHTML = args.text;
  } else if (verifyMessage(args)) {
    textEl.innerHTML = md.render(args.text);
  } else {
    let pEl = document.createElement('p')
    pEl.appendChild(document.createTextNode(args.text))
    pEl.classList.add('break') //make lines broken at newline characters, as this text is not rendered and may contain raw newline characters
    textEl.appendChild(pEl)
    console.log('norender to dangerous message:', args)
  }
  // Optimize CSS of code blocks which have no specified language name: add a hjls class for them
  textEl.querySelectorAll('pre > code').forEach((element) => {
    let doElementHasClass = false
    element.classList.forEach((cls) => {
      if (cls.startsWith('language-') || cls == 'hljs') {
        doElementHasClass = true
      }
    })
    if (!doElementHasClass) {
      element.classList.add('hljs')
    }
  })
  messageEl.appendChild(textEl);

  // Scroll to bottom
  var atBottom = isAtBottom();
  $('#messages').appendChild(messageEl);
  if (atBottom && myChannel != ''/*Frontpage should not be scrooled*/) {
    window.scrollTo(0, document.body.scrollHeight);
  }

  unread += 1;
  updateTitle();

  if (doLogMessages && args.nick && args.text) {
    readableLog += `\n[${date.toLocaleString()}] `
    if (args.mod) { readableLog += '(mod) ' }
    if (args.color) { readableLog += '(color:' + args.color + ') ' }
    readableLog += args.nick
    if (args.trip) { readableLog += '#' + args.trip }
    readableLog += ': ' + args.text
  }
}

function insertAtCursor(text) {
  var input = $('#chatinput');
  var start = input.selectionStart || 0;
  var before = input.value.substr(0, start);
  var after = input.value.substr(start);

  before += text;
  input.value = before + after;
  input.selectionStart = input.selectionEnd = before.length;

  updateInputSize();
}

function send(data) {
  if (ws && ws.readyState == ws.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

/* ---Session Command--- */

function getInfo() {
  return new Promise(function(resolve, reject) {
    ws = new WebSocket('wss://xq.kzw.ink/ws');

    ws.onopen = function() {
      this.send(JSON.stringify({ cmd: "session", isBot: false }))
    }

    ws.onmessage = function(message) {
      data = JSON.parse(message.data)
      if (data.cmd != 'session') {
        return
      }
      info.public = data.public
      info.chans = data.chans
      info.users = data.users
      if (shouldGetInfo) {
        for (let i = 0; i < channels.length; i++) {
          let line = channels[i]
          let newLineChannels = []
          for (let channel of line.split(/ ?\?/g).slice(1)) {
            if (typeof info.public[channel] === typeof 0) {
              channel = channel + ' ' + '(' + info.public[channel] + ')'
            }
            newLineChannels.push('?' + channel)
          }
          channels[i] = newLineChannels.join(' ')
        }
      }
      this.close()
      resolve()
    }
  })
}

/* ---Window and input field and sidebar stuffs--- */

var windowActive = true;
var unread = 0;

window.onfocus = function() {
  windowActive = true;

  updateTitle();
}

window.onblur = function() {
  windowActive = false;
}

window.onscroll = function() {
  if (isAtBottom()) {
    updateTitle();
  }
}

function isAtBottom() {
  return (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 1);
}

function updateTitle() {
  if (myChannel == '') {
    unread = 0;
    return;
  }

  if (windowActive && isAtBottom()) {
    unread = 0;
  }

  var title;
  if (myChannel) {
    title = myChannel + " - hack.chat++";
  } else {
    title = "淡茶聊天室";
  }

  if (unread > 0) {
    title = '(' + unread + ') ' + title;
  }

  document.title = title;
}

$('#footer').onclick = function() {
  $('#chatinput').focus();
}

$('#chatinput').onkeydown = function(e) {
  if (e.keyCode == 13 /* ENTER */ && !e.shiftKey) {
    e.preventDefault();

    if (!wasConnected) {
      pushMessage({ nick: '*', text: "Attempting to reconnect. . ." })
      join(myChannel);
    }

    // Submit message
    if (e.target.value != '') {
      var text = e.target.value;
      e.target.value = '';

      if (templateStr) {
        if (templateStr.indexOf('%m') > -1) {
          text = templateStr.replace('%m', text);
        }
      }

      if (kolorful) {
        send({ cmd: 'changecolor', color: Math.floor(Math.random() * 0xffffff).toString(16).padEnd(6, "0") })
      }

      if (isAnsweringCaptcha && text != text.toUpperCase()) {
        text = text.toUpperCase()
        pushMessage({ nick: '*', text: 'Automatically converted into upper case by client.' })
      }

      if (purgatory) {
        send({ cmd: 'emote', text: text });
      } else {
        send({ cmd: 'chat', text: text });
      }

      lastSent[0] = text;
      lastSent.unshift("");
      lastSentPos = 0;

      updateInputSize();
    }
  } else if (e.keyCode == 38 /* UP */) {
    // Restore previous sent messages
    if (e.target.selectionStart === 0 && lastSentPos < lastSent.length - 1) {
      e.preventDefault();

      if (lastSentPos == 0) {
        lastSent[0] = e.target.value;
      }

      lastSentPos += 1;
      e.target.value = lastSent[lastSentPos];
      e.target.selectionStart = e.target.selectionEnd = e.target.value.length;

      updateInputSize();
    }
  } else if (e.keyCode == 40 /* DOWN */) {
    if (e.target.selectionStart === e.target.value.length && lastSentPos > 0) {
      e.preventDefault();

      lastSentPos -= 1;
      e.target.value = lastSent[lastSentPos];
      e.target.selectionStart = e.target.selectionEnd = 0;

      updateInputSize();
    }
  } else if (e.keyCode == 27 /* ESC */) {
    e.preventDefault();

    // Clear input field
    e.target.value = "";
    lastSentPos = 0;
    lastSent[lastSentPos] = "";

    updateInputSize();
  } else if (e.keyCode == 9 /* TAB */) {
    // Tab complete nicknames starting with @

    if (e.ctrlKey) {
      // Skip autocompletion and tab insertion if user is pressing ctrl
      // ctrl-tab is used by browsers to cycle through tabs
      return;
    }
    e.preventDefault();

    var pos = e.target.selectionStart || 0;
    var text = e.target.value;
    var index = text.lastIndexOf('@', pos);

    var autocompletedNick = false;

    if (index >= 0) {
      var stub = text.substring(index + 1, pos).toLowerCase();
      // Search for nick beginning with stub
      var nicks = onlineUsers.filter(function(nick) {
        return nick.toLowerCase().indexOf(stub) == 0
      });

      if (nicks.length > 0) {
        autocompletedNick = true;
        if (nicks.length == 1) {
          insertAtCursor(nicks[0].substr(stub.length) + " ");
        }
      }
    }

    // Since we did not insert a nick, we insert a tab character
    if (!autocompletedNick) {
      insertAtCursor('\t');
    }
  }
}

function updateInputSize() {
  var atBottom = isAtBottom();

  var input = $('#chatinput');
  input.style.height = 0;
  input.style.height = input.scrollHeight + 'px';
  document.body.style.marginBottom = $('#footer').offsetHeight + 'px';

  if (atBottom) {
    window.scrollTo(0, document.body.scrollHeight);
  }
}

$('#chatinput').oninput = function() {
  updateInputSize();
}

/* sidebar */

$('#sidebar').onmouseenter = $('#sidebar').onclick = function(e) {
  if (e.target == $('#sidebar-close')) {
    return
  }
  $('#sidebar-content').classList.remove('hidden');
  $('#sidebar').classList.add('expand');
  e.stopPropagation();
}

$('#sidebar').onmouseleave = document.ontouchstart = function(event) {
  var e = event.toElement || event.relatedTarget;
  try {
    if (e.parentNode == this || e == this) {
      return;
    }
  } catch (e) { return; }

  if (!$('#pin-sidebar').checked) {
    $('#sidebar-content').classList.add('hidden');
    $('#sidebar').classList.remove('expand');
  }
}

$('#sidebar-close').onclick = function() {
  if (!$('#pin-sidebar').checked) {
    $('#sidebar-content').classList.add('hidden');
    $('#sidebar').classList.remove('expand');
  }
}

/* ---Sidebar buttons--- */

$('#clear-messages').onclick = function() {
  // Delete children elements
  var messages = $('#messages');
  messages.innerHTML = '';
}

$('#set-custom-color').onclick = function() {
  // Set auto changecolor
  let color = prompt(i18ntranslate('Your nickname color:(press enter without inputing to reset; input "random" to set it to random)'))
  if (color == null) {
    return;
  }
  if (color == 'random') {
    myColor = 'random';
    pushMessage({ nick: '*', text: "Suessfully set your auto nickname color to random. Rejoin or join a Channel to make it go into effect." })
  } else if (/(#?)((^[0-9A-F]{6}$)|(^[0-9A-F]{3}$))/i.test(color)) {
    myColor = color.replace(/#/, '');
    pushMessage({ nick: '*', text: `Suessfully set your auto nickname color to #${myColor}. Rejoin or join a Channel to make it go into effect.` })
  } else if (color == '') {
    myColor = null;
    pushMessage({ nick: '*', text: "Suessfully disabled autocolor." })
  } else {
    pushMessage({ nick: '!', text: "Invalid color. Please give color in hex RGB code." })
  }
  localStorageSet('my-color', myColor || '')//if myColor is null, set an empty string so that when it is got it will be ('' || null) (confer {var myColor = localStorageGet('my-color') || null;} at about line 190) the value of which is null
}

$('#set-template').onclick = function() {
  // Set auto changetemplate
  let template = prompt(i18ntranslate('Your template string:(use %m to replace your message content. press enter without inputing to reset.)'))
  if (template == null) {
    return;
  }
  if (template.indexOf('%m') > -1) {
    const rand = String(Math.random()).slice(2)
    templateStr = template
      .replace(/\\\\/g, rand)
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(new RegExp(rand, 'g'), '\\\\')
    pushMessage({ nick: '*', text: "Suessfully set template." })
  } else if (template == '') {
    templateStr = null;
    pushMessage({ nick: '*', text: "Suessfully disabled template." })
  } else {
    pushMessage({ nick: '!', text: "Invalid template. " })
  }
  localStorageSet('my-template', templateStr || '')
}

$('#export-json').onclick = function() {
  navigator.clipboard.writeText(jsonLog).then(function() {
    pushMessage({ nick: '*', text: "JSON log successfully copied to clipboard. Please save it in case it may be lost." })
  }, function() {
    pushMessage({ nick: '!', text: "Failed to copy log to clipboard." })
  });
}

$('#export-readable').onclick = function() {
  navigator.clipboard.writeText(readableLog).then(function() {
    pushMessage({ nick: '*', text: "Normal log successfully copied to clipboard. Please save it in case it may be lost." })
  }, function() {
    pushMessage({ nick: '!', text: "Failed to copy log to clipboard." })
  });
}

$('#special-cmd').onclick = function() {
  let cmdText = prompt(i18ntranslate('Input command:(This is for the developer\'s friends to access some special experimental functions.)'));
  if (!cmdText) {
    return;
  }
  let run = {
    copy:/*copy the x-th last message*/
      function(...args) {
        if (args == []) {
          args = ['0']
        }
        if (args.length != 1) {
          pushMessage({ nick: '!', text: `${args.length} arguments are given while 0 or 1 is needed.` })
          return
        }
        let logList = readableLog.split('\n')
        if (logList.length <= args[0] || !doLogMessages) {
          pushMessage({ nick: '!', text: `No enough logs.` })
          return
        }
        let logItem = logList[logList.length - args[0] - 1]
        navigator.clipboard.writeText(logItem).then(function() {
          pushMessage({ nick: '*', text: "Copied: " + logItem })
        }, function() {
          pushMessage({ nick: '!', text: "Failed to copy log to clipboard." })
        });
      },
    reload:
      function(...args) {
        if (args.length != 0) {
          pushMessage({ nick: '!', text: `${args.length} arguments are given while 0 is needed.` })
          return
        }
        location.reload()
      },
    coderMode:
      function(...args) {
        if (!localStorageGet('coder-mode') || localStorageGet('coder-mode') != 'true') {
          coderMode()
          localStorageSet('coder-mode', true)
        } else {
          localStorageSet('coder-mode', false)
          pushMessage({ nick: '*', text: `Refresh to hide coder buttons.` })
        }
      },
    test:
      function(...args) {
        pushMessage({ nick: '!', text: `${args.length} arguments ${args}` })
      },
    about:
      function(...args) {
        let a = 'HC++ Made by 4n0n4me at hcer.netlify.app'
        console.log(a)
      },
    colorful:
      function(...args) {
        kolorful = true
      },
    raw:
      function(...args) {
        let escaped = mdEscape(cmdText.slice(4))
        pushMessage({ nick: '*', text: `\`\`\`\n${escaped}\n\`\`\`` })
        navigator.clipboard.writeText(escaped).then(function() {
          pushMessage({ nick: '*', text: "Escaped text copied to clipboard." })
        }, function() {
          pushMessage({ nick: '!', text: "Failed to copy log to clipboard." })
        });
      },
    preview:
      function(...args) {
        $('#messages').innerHTML = '';
        pushMessage({ nick: '*', text: '信息测试' })
        pushMessage({ nick: '!', text: '警告测试' })
        pushMessage({ nick: '[test]', text: '# 标题测试\n\n正文测试\n\n[链接测试](https://hcwiki.github.io/)\n\n> 引用测试' })
        $('#footer').classList.remove('hidden')
      }
  }
  cmdArray = cmdText.split(' ')
  if (run[cmdArray[0]]) {
    run[cmdArray[0]](...cmdArray.slice(1))
  } else {
    pushMessage({ nick: '!', text: "No such function: " + cmdArray[0] })
  }
}

function coderMode() {
  for (char of ['(', ')', '"']) {
    btn = document.createElement('button')
    btn.type = 'button'
    btn.classList.add('char')
    btn.textContent = char
    btn.onclick = function() {
      insertAtCursor(btn.innerHTML)
    }
    $('#more-mobile-btns').appendChild(btn)
  }
}

if (localStorageGet('coder-mode') == 'true') {
  coderMode()
}

$('#img-upload').onclick = function() {
  if (localStorageGet('image-upload') != 'true') {
    confirmed = confirm(i18ntranslate('Image host provided by Dataeverything team. All uploads on your own responsibility.'))
    if (confirmed) {
      localStorageSet('image-upload', true)
    } else {
      return
    }
  }
  window.open('https://img.thz.cool/upload', 'newwindow', 'height=512, width=256, top=50%,left=50%, toolbar=no, menubar=no, scrollbars=no, resizable=no,location=no, status=no')
}

/* ---Sidebar settings--- */

// Restore settings from localStorage

if (localStorageGet('pin-sidebar') == 'true') {
  $('#pin-sidebar').checked = true;
  $('#sidebar-content').classList.remove('hidden');
}

if (localStorageGet('joined-left') == 'false') {
  $('#joined-left').checked = false;
}

if (localStorageGet('parse-latex') == 'false') {
  $('#parse-latex').checked = false;
  md.inline.ruler.disable(['katex']);
  md.block.ruler.disable(['katex']);
}

$('#pin-sidebar').onchange = function(e) {
  localStorageSet('pin-sidebar', !!e.target.checked);
}

$('#joined-left').onchange = function(e) {
  localStorageSet('joined-left', !!e.target.checked);
}

$('#parse-latex').onchange = function(e) {
  var enabled = !!e.target.checked;
  localStorageSet('parse-latex', enabled);
  if (enabled) {
    md.inline.ruler.enable(['katex']);
    md.block.ruler.enable(['katex']);
  } else {
    md.inline.ruler.disable(['katex']);
    md.block.ruler.disable(['katex']);
  }
}

if (localStorageGet('syntax-highlight') == 'false') {
  $('#syntax-highlight').checked = false;
  markdownOptions.doHighlight = false;
}

$('#syntax-highlight').onchange = function(e) {
  var enabled = !!e.target.checked;
  localStorageSet('syntax-highlight', enabled);
  markdownOptions.doHighlight = enabled;
}

if (localStorageGet('allow-imgur') == 'false') {
  $('#allow-imgur').checked = false;
  allowImages = false;
  $('#allow-all-img').disabled = true;
} else {
  $('#allow-imgur').checked = true;
  allowImages = true;
}


if (localStorageGet('whitelist-disabled') == 'true') {
  $('#allow-all-img').checked = true;
  whitelistDisabled = true;
} else {
  $('#allow-all-img').checked = false;
  whitelistDisabled = false;
}

$('#allow-imgur').onchange = function(e) {
  var enabled = !!e.target.checked;
  localStorageSet('allow-imgur', enabled);
  allowImages = enabled;
  $('#allow-all-img').disabled = !enabled;
}

$('#allow-all-img').onchange = function(e) {
  var enabled = !!e.target.checked;
  localStorageSet('whitelist-disabled', enabled);
  whitelistDisabled = enabled;
}

if (localStorageGet('soft-mention') == 'true') {
  $('#soft-mention').checked = true;
  softMention = true;
} else {
  $('#soft-mention').checked = false;
  softMention = false;
}

$('#soft-mention').onchange = function(e) {
  var enabled = !!e.target.checked;
  localStorageSet('soft-mention', enabled);
  softMention = enabled;
}

if (localStorageGet('message-log') == 'true') {
  $('#message-log').checked = true;
  doLogMessages = true;
} else {
  $('#message-log').checked = false;
  doLogMessages = false;
}
logOnOff()

$('#message-log').onchange = function(e) {
  var enabled = !!e.target.checked;
  localStorageSet('message-log', enabled);
  doLogMessages = enabled;
  logOnOff()
}

function logOnOff() {
  let a;
  if (doLogMessages) { a = '[log enabled]' } else { a = '[log disabled]' }
  jsonLog += a;
  readableLog += '\n' + a;
}

if (localStorageGet('mobile-btn') == 'true') {
  $('#mobile-btn').checked = true;
} else {
  $('#mobile-btn').checked = false;
  $('#mobile-btns').classList.add('hidden');
  $('#more-mobile-btns').classList.add('hidden');
}

updateInputSize();

$('#mobile-btn').onchange = function(e) {
  var enabled = !!e.target.checked;
  localStorageSet('mobile-btn', enabled);
  if (enabled) {
    $('#mobile-btns').classList.remove('hidden');
    $('#more-mobile-btns').classList.remove('hidden');
  } else {
    $('#mobile-btns').classList.add('hidden');
    $('#more-mobile-btns').classList.add('hidden');
  }
  updateInputSize();
}

if (localStorageGet('should-get-info') == 'true') {
  $('#should-get-info').checked = true;
  shouldGetInfo = true;
} else {
  $('#should-get-info').checked = false;
  shouldGetInfo = false;
}

$('#should-get-info').onchange = function(e) {
  var enabled = !!e.target.checked;
  localStorageSet('should-get-info', enabled);
  shouldGetInfo = enabled;
}

/* ---Buttons for some mobile users--- */

$('#tab').onclick = function() {
  var pos = $('#chatinput').selectionStart || 0;
  var text = $('#chatinput').value;
  var index = text.lastIndexOf('@', pos);

  var autocompletedNick = false;

  if (index >= 0) {
    var stub = text.substring(index + 1, pos).toLowerCase();
    // Search for nick beginning with stub
    var nicks = onlineUsers.filter(function(nick) {
      return nick.toLowerCase().indexOf(stub) == 0
    });

    if (nicks.length > 0) {
      autocompletedNick = true;
      if (nicks.length == 1) {
        insertAtCursor(nicks[0].substr(stub.length) + " ");
      }
    }
  }

  // Since we did not insert a nick, we insert a tab character
  if (!autocompletedNick) {
    insertAtCursor('\t');
  }
}

document.querySelectorAll('button.char').forEach(function(el) {
  el.onclick = function() {
    insertAtCursor(el.innerHTML)
  }
})

$('#sent-pre').onclick = function() {
  if (lastSentPos < lastSent.length - 1) {
    if (lastSentPos == 0) {
      lastSent[0] = $('#chatinput').value;
    }

    lastSentPos += 1;
    $('#chatinput').value = lastSent[lastSentPos];
    $('#chatinput').selectionStart = $('#chatinput').selectionEnd = $('#chatinput').value.length;

    updateInputSize();
  }
}

$('#sent-next').onclick = function() {
  if (lastSentPos > 0) {
    lastSentPos -= 1;
    $('#chatinput').value = lastSent[lastSentPos];
    $('#chatinput').selectionStart = $('#chatinput').selectionEnd = 0;

    updateInputSize();
  }
}

$('#send').onclick = function() {
  if (!wasConnected) {
    pushMessage({ nick: '*', text: "Attempting to reconnect. . ." })
    join(myChannel);
  }

  // Submit message
  if ($('#chatinput').value != '') {
    var text = $('#chatinput').value;
    $('#chatinput').value = '';

    if (templateStr) {
      if (templateStr.indexOf('%m') > -1) {
        text = templateStr.replace('%m', text);
      }
    }

    if (kolorful) {
      send({ cmd: 'changecolor', color: Math.floor(Math.random() * 0xffffff).toString(16).padEnd(6, "0") })
    }

    if (isAnsweringCaptcha && text != text.toUpperCase()) {
      text = text.toUpperCase()
      pushMessage({ nick: '*', text: 'Automatically converted into upper case by client.' })
    }

    if (purgatory) {
      send({ cmd: 'emote', text: text });
    } else {
      send({ cmd: 'chat', text: text });
    }

    lastSent[0] = text;
    lastSent.unshift("");
    lastSentPos = 0;

    updateInputSize();
  }
}

$('#feed').onclick = function() {
  insertAtCursor('\n')
}

/* ---Sidebar user list--- */

// User list
var onlineUsers = [];
var ignoredUsers = [];

function userAdd(nick, trip) {
  if (nick.length >= 25) {
    pushMessage({ nick: '!', text: "A USER WHOSE NICKNAME HAS MORE THAN 24 CHARACTERS HAS JOINED. THIS INFINITE LOOP SCRIPT WHICH MAY CRASH YOUR BROWSER WOULD BE RUN IN OFFICIAL CLIENT:\n ```Javascript\nfor (var i = 5; i > 3; i = i + 1) { console.log(i); }\n```" })
    pushMessage({ nick: '!', text: "This is probably caused by a moderator using the `overflow` command on you. Maybe that command is one supposed to crash the browser of the target user..." })
  }

  var user = document.createElement('a');
  user.textContent = nick;

  user.onclick = function(e) {
    userInvite(nick)
  }

  user.oncontextmenu = function(e) {
    e.preventDefault()
    if (ignoredUsers.indexOf(nick) > -1) {
      userDeignore(nick)
      pushMessage({ nick: '*', text: `Cancelled ignoring nick ${nick}.` })
    } else {
      userIgnore(nick)
      pushMessage({ nick: '*', text: `Ignored nick ${nick}.` })
    }
  }

  var userLi = document.createElement('li');
  userLi.appendChild(user);

  if (trip) {
    let tripEl = document.createElement('span')
    tripEl.textContent = ' ' + trip
    tripEl.classList.add('trip')
    userLi.appendChild(tripEl)
  }

  $('#users').appendChild(userLi);
  onlineUsers.push(nick);
}

function userRemove(nick) {
  var users = $('#users');
  var children = users.children;

  for (var i = 0; i < children.length; i++) {
    var user = children[i];
    if (user.firstChild/*hc++ shows tripcodes in userlist, so a user element has two children for the nickname and the tripcode.*/.textContent == nick) {
      users.removeChild(user);
    }
  }

  var index = onlineUsers.indexOf(nick);
  if (index >= 0) {
    onlineUsers.splice(index, 1);
  }
}

function usersClear() {
  var users = $('#users');

  while (users.firstChild) {
    users.removeChild(users.firstChild);
  }

  onlineUsers.length = 0;
}

function userInvite(nick) {
  target = prompt(i18ntranslate('target channel:(defaultly random channel generated by server)'))
  if (target) {
    send({ cmd: 'invite', nick: nick, to: target });
  } else {
    if (target == '') {
      send({ cmd: 'invite', nick: nick });
    }
  }
}

function userIgnore(nick) {
  ignoredUsers.push(nick)
}

function userDeignore(nick) {
  ignoredUsers.splice(ignoredUsers.indexOf(nick))
}

/* ---Sidebar switchers--- */

/* color scheme switcher */

var schemes = [
  'android',
  'android-white',
  'atelier-dune',
  'atelier-forest',
  'atelier-heath',
  'atelier-lakeside',
  'atelier-seaside',
  'banana',
  'bright',
  'bubblegum',
  'chalk',
  'default',
  'eighties',
  'fresh-green',
  'greenscreen',
  'hacker',
  'maniac',
  'mariana',
  'military',
  'mocha',
  'monokai',
  'nese',
  'ocean',
  'omega',
  'pop',
  'railscasts',
  'solarized',
  'tk-night',
  'tomorrow',
  'carrot',
  'lax',
  'Ubuntu',
  'gruvbox-light',
  'fried-egg',
  'rainbow',
  'turbid-jade',
  'old-paper',
  'chemistory-blue',
  // 'crosst-chat-night',
  // 'crosst-chat-city',
  'backrooms-liminal',
];

var highlights = [
  'agate',
  'androidstudio',
  'atom-one-dark',
  'darcula',
  'github',
  'rainbow',
  'tk-night',
  'tomorrow',
  'xcode',
  'zenburn'
]

var languages = [
  ['English', 'en-US'],
  ['简体中文', 'zh-CN']
]

var currentScheme = 'atelier-dune';
var currentHighlight = 'darcula';

function setScheme(scheme) {
  currentScheme = scheme;
  $('#scheme-link').href = "schemes/" + scheme + ".css";
  localStorageSet('scheme', scheme);
}

function setHighlight(scheme) {
  currentHighlight = scheme;
  $('#highlight-link').href = "vendor/hljs/styles/" + scheme + ".min.css";
  localStorageSet('highlight', scheme);
}

function setLanguage(language) {
  lang = language
  localStorageSet('i18n', lang);
  pushMessage({ nick: '!', text: 'Please refresh to apply language. Multi language is in test and not perfect yet. ' }, true)
}

// Add scheme options to dropdown selector
schemes.forEach(function(scheme) {
  var option = document.createElement('option');
  option.textContent = scheme;
  option.value = scheme;
  $('#scheme-selector').appendChild(option);
});

highlights.forEach(function(scheme) {
  var option = document.createElement('option');
  option.textContent = scheme;
  option.value = scheme;
  $('#highlight-selector').appendChild(option);
});

languages.forEach(function(item) {
  var option = document.createElement('option');
  option.textContent = item[0];
  option.value = item[1];
  $('#i18n-selector').appendChild(option);
});

$('#scheme-selector').onchange = function(e) {
  setScheme(e.target.value);
}

$('#highlight-selector').onchange = function(e) {
  setHighlight(e.target.value);
}

$('#i18n-selector').onchange = function(e) {
  setLanguage(e.target.value)
}

// Load sidebar configaration values from local storage if available
if (localStorageGet('scheme')) {
  setScheme(localStorageGet('scheme'));
}

if (localStorageGet('highlight')) {
  setHighlight(localStorageGet('highlight'));
}

$('#scheme-selector').value = currentScheme;
$('#highlight-selector').value = currentHighlight;
$('#i18n-selector').value = lang;

/* ---Add some CSS--- */

/*
if (navigator.userAgent.indexOf('iPhone') > 0) {
  style = document.createElement('style')
  style.textContent = `
    button {
      border-radius:5%;
      padding:0%;
    }
  `
  document.getElementsByTagName('body')[0].appendChild(style)
}
*/

/* ---Main--- */

if (myChannel == '') {
  $('#footer').classList.add('hidden');
  /*$('#sidebar').classList.add('hidden');*/
  /*I want to be able to change the settings without entering a channel*/
  $('#clear-messages').classList.add('hidden');
  $('#export-json').classList.add('hidden');
  $('#export-readable').classList.add('hidden');
  $('#users-div').classList.add('hidden');
  pushFrontPage()
  if (shouldGetInfo) {
    getInfo().then(function() {
      $('#messages').innerHTML = '';
      pushFrontPage()
    })
  }
} else {
  join(myChannel);
}

let a = 'HC++ Made by 4n0n4me at hcer.netlify.app'
console.log(a)
