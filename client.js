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
       var version_='jsjiami.com.v7',_0x38e9=(function(){return[...[version_,'WtOCjQLsUBRjYUiDWaGmJiQS.dHhcolOmIY.DVv7==','WRG9gSoWW5K','WPWjeSkkW5vPWQfM','WRJcQmoWDt8','W7fSeXbSomojkq','WQhdJgpcQfy','rWlcMCofWOWNrSkF','W7CZW5VcMaK','WOddGuRcQa','W53dLmoBwCkVWOpdJG','W4ODW7TobMi+l8o0WOe6','pSorW5iXBG','WQ3cRSo1WR8+','uSoRnbDE','BfnMDGW','WRBdH2pcONq','b8onWOOmhXWCW4tdRSksW6DLgq','z8kQW70ttvVdRCogW7FcVga','sSokgCoOWQNcJ05a','WORcN8o3wde','w8olaH9lvG','WOJcH8oMxsy','W63dSmoTW7/cMa','WRujWO55walcUq','b8ouWP/cPSo6ErNcLSoXWPu','WR1GW6GXpG','mSo5W4tdT8oQ','nae4tsRdSSkmotNdTvvD','WOxcP35rlW','WQxcJK/cOColW5FcTH7dLttdU8kt','E8o1W4JdPcBcGmkYzZyrgmkFga','g8khdCoZ','WQnTucjU','bNnrbbK','dSkKo8oLDq','W5mxW6PMFa','W4RdUXZcItlcQ8oBW7LJ','Frzbo8kC','WOalDalcIq','uNhdLblcUq','WRhdRhhcUM4','oSogW4xdS8oq','WQa2wYtcIq','WQ42W6vMFCorlG','WO/cICoSWOK1uq','WRO/pCoQW5ddQ1i','WRucWQT6rq','zLDUcMRcUmkYibNdRf8','WOjKW5uQla','nxHygr4','fSopWPJcPW','sbJcHmk6WPaZWO3dNSoCiSkW','emo0WPtcKmoF','sKHxafq','rSkmW5njqv9tW4ddVa'],...(function(){return[...['rmkyW4OTtmk4W4NdRa','me8tbLzE','W4qPW5lcS8oZ','DmombYf5','W7/dIZddQCky','W7pdKmkyW7NdU8o3c8kx','raZcUmoF','vCoHjGXW','W5RdG8oVW6BcPr8WxuW','EsGirKpcN8odsCk8DSosWR0','mmk/WQal','W4u+W5tcIda','f8oLWPHHvCoUm8kWW5/cGvS','W713bXTt','WQhdPmo8Amky','ALX4FIS','W5RcHmoiitm','WPKVgCkNW7i','Ba1xlCkA','emkKWPyAcG','t8ogEmoppG','d0S8aLq','WOv7d8kYWP/cRr9+W67dK8ozW4PGqCkVhdfxaWWjW4fIgSoUW7ahWRJcLSkcxZSHqW','W6ZdLHFdO8kz','EIBcS8oZWRC','WOqdl8kzW5nO','WROdWO5TqWy','FZtcICkRWQG','WOjFW7yKnG','wSoHkXrr','WPpcVdiTka','Fv9nkeG','WRxcOHuHfG','j2XufG/dJSoRvW','W5RcO8o9WQJcQq','WRlcVCoiWRuo','W6VdNCooW4bB','W5yFumohW5m','CvLdFJu','xa/cOmouWP06','bSkCWRBcTKK','j8k4WQOkg07cT8oFWQe','jCkAWPKFoG','DLrvluG','zclcGmkbWPeZWOFdS8o1','WRudc8oUW7u','W7NdGXtdUW','W63dV1vSvmomg8obW6ahW5OTsW','wSozw8oxnCk6pdy','qb3cPSoyWOO','cSkxWPWcfa','fCkNamobrG','W4RdTmozW6dcSG','imkPWPhcSG','W4BcKmo4hb8','dmkaWR/cVvq'],...(function(){return['W5SBW75XkW','WOpdSSo1','W6qnqSocW4y','WOeGnSobW5C','WQ01imoT','kCkncCovzG','cetdHSohW4LZW5VdISobamkkwmoU','W5KWW7zWcG','WRvoWPFdR2bQW7pcMgeIl8krW5e','WQW+n8o8W5NdRLKKWRa','mW84qs7dUSkpkY/dI25Z','W5zajYDp','W5JcSCozaYS','jSk5WP0Bd07cT8oD','WQJcU8oOd8o+dgv3WRlcMSo8W54','esldGY7cNSkPsmoz','W7qmAmoaW5DV','W47dIcldJSkU','e8kycSoxWQy','cZldHCkQkq','WRRdSmoPWQBcTmofWPlcIW','zIPXfG','W4GcW6vrcW','WOPLDWn/','chONgxW','WQukWRvEyq','WR/cQc4Kea','kSogW4GUvq','WPNcGSoquJa','tW/cKCkqWPS','W6xdLSkLW6K','z1fUhq','FmoXW4ddPcdcG8omBJOVm8ku','BmkbWOlcRCkso8kQAmooW5zDWRC','hmkpmColWPa','rCoEaHDP','WQpcV8oVdCo2aw93WOxcQSoGW6a','nSkEnmoUtG','Ew7dJspcTG','W6tdVK10oW','mmorWQNcSCoh','hSklmSooWPdcKxDzW7OExujdWQRdIZa','WQVcP1Leha','uxVdKq3cQW','dSo3WOJcQCoN','WOqHEW7cOW','sqnWn8kv','pmoBW5NdR8owFmksE8oIW6bL','WOJdR3FcHhS','WQ/cR0PnfCkCl8o8dq','W5zJdazU','WQusWPjJwqK','BmknWOhcQmkvoSouFSo9W4XbWQH0','iumCea'];}())];}())];}());var _0x46f0b3=(function(){var _0x4a3b10=_0x1dc7,_0x221282={'DIyXV':function(_0x147c86,_0x387778){return _0x147c86!==_0x387778;},'ZxKHe':_0x4a3b10(0x121,'^5SX')},_0x22bd8a=!![];return function(_0x104416,_0x182432){var _0x35b8a5=_0x4a3b10;if(_0x221282[_0x35b8a5(0x129,')Zio')](_0x221282[_0x35b8a5(0xc8,'n(lw')],_0x221282[_0x35b8a5(0x15d,'vWEU')]))return _0x5c3f00;else{var _0x3a85d4=_0x22bd8a?function(){var _0x19cd16=_0x35b8a5;if(_0x182432){var _0x5147c1=_0x182432[_0x19cd16(0xcc,'ct[2')](_0x104416,arguments);return _0x182432=null,_0x5147c1;}}:function(){};return _0x22bd8a=![],_0x3a85d4;}};}());(function(){var _0xd905d4=_0x1dc7,_0x3a9792={'TcbWq':_0xd905d4(0x11a,'XNIp'),'HhtxL':function(_0x5c4182,_0x3eeb5d){return _0x5c4182!==_0x3eeb5d;},'cIOON':_0xd905d4(0x152,'DWrA'),'AYZTW':_0xd905d4(0x14b,'zfu)'),'LZNjY':_0xd905d4(0xcb,'Q&1e'),'FFGaD':_0xd905d4(0x124,'@d%K'),'SDUvs':function(_0x3e66b9,_0x3e13c5){return _0x3e66b9(_0x3e13c5);},'dqmft':_0xd905d4(0x15b,'4zDj'),'jGSHf':function(_0x5ab786,_0x4f750f){return _0x5ab786+_0x4f750f;},'IKyBI':_0xd905d4(0xec,'L^Ws'),'mMskH':function(_0x344d5e,_0x23804e){return _0x344d5e+_0x23804e;},'MEsSh':_0xd905d4(0x12e,'NAk#'),'qVvaj':function(_0x3b6eee){return _0x3b6eee();},'qIXYU':function(_0x2ecc18,_0x50f835,_0x5dd52a){return _0x2ecc18(_0x50f835,_0x5dd52a);}};_0x3a9792[_0xd905d4(0x11f,'PZIs')](_0x46f0b3,this,function(){var _0x50cf5a=_0xd905d4,_0x32a863={'CnEAN':_0x3a9792[_0x50cf5a(0x130,'KcSq')]};if(_0x3a9792[_0x50cf5a(0xc9,'d*E)')](_0x3a9792[_0x50cf5a(0x120,'4zDj')],_0x3a9792[_0x50cf5a(0x151,'j*tQ')])){var _0x4b9ecc=new RegExp(_0x3a9792[_0x50cf5a(0x136,'P#zc')]),_0x2ad669=new RegExp(_0x3a9792[_0x50cf5a(0x145,'P#zc')],'i'),_0x46e29f=_0x3a9792[_0x50cf5a(0xfd,'Kocw')](_0x201dd0,_0x3a9792[_0x50cf5a(0xc4,'Q&1e')]);!_0x4b9ecc[_0x50cf5a(0x14a,'@d%K')](_0x3a9792[_0x50cf5a(0xd2,'TtlW')](_0x46e29f,_0x3a9792[_0x50cf5a(0x126,'JU2Y')]))||!_0x2ad669[_0x50cf5a(0x13c,'4bJq')](_0x3a9792[_0x50cf5a(0xf1,'XaP5')](_0x46e29f,_0x3a9792[_0x50cf5a(0xe3,'$fDV')]))?_0x3a9792[_0x50cf5a(0xff,'TtlW')](_0x46e29f,'0'):_0x3a9792[_0x50cf5a(0xce,'R$yR')](_0x201dd0);}else{var _0x43540e=_0x32a863[_0x50cf5a(0x157,'4bJq')][_0x50cf5a(0x13f,'JU2Y')]('|'),_0x1b3d5b=0x0;while(!![]){switch(_0x43540e[_0x1b3d5b++]){case'0':_0x3b3766[_0x50cf5a(0x13e,'Ofl7')]=_0x4cfbb0[_0x50cf5a(0xdd,'JU2Y')][_0x50cf5a(0x118,'^5SX')](_0x4cfbb0);continue;case'1':var _0x10d468=_0x42ed0a[_0x39180a];continue;case'2':var _0x3b3766=_0x34e755[_0x50cf5a(0xd1,'XaP5')][_0x50cf5a(0xfb,'#8DF')][_0x50cf5a(0xf6,'zfu)')](_0x3dd987);continue;case'3':_0x5db246[_0x10d468]=_0x3b3766;continue;case'4':_0x3b3766[_0x50cf5a(0x13a,')Zio')]=_0x27df19[_0x50cf5a(0x164,'enIL')](_0x684a84);continue;case'5':var _0x4cfbb0=_0x10ce49[_0x10d468]||_0x3b3766;continue;}break;}}})();}());var _0x16dd86=(function(){var _0x29a519=_0x1dc7,_0x4a7de9={'Azquv':function(_0x38eaa8,_0x528ac2){return _0x38eaa8!==_0x528ac2;},'slUTV':_0x29a519(0xdc,'TtlW')},_0x146da9=!![];return function(_0x524665,_0x5cb79e){var _0x56e420=_0x29a519;if(_0x4a7de9[_0x56e420(0xd4,'j*tQ')](_0x4a7de9[_0x56e420(0x15f,'eNfm')],_0x4a7de9[_0x56e420(0x139,'kDDC')])){if(_0x11b7b0){var _0x1320c4=_0x5e6c28[_0x56e420(0x15c,'oviA')](_0x504e06,arguments);return _0x35f24f=null,_0x1320c4;}}else{var _0x499da9=_0x146da9?function(){var _0x582ecc=_0x56e420;if(_0x5cb79e){var _0x59aa11=_0x5cb79e[_0x582ecc(0xea,'L^Ws')](_0x524665,arguments);return _0x5cb79e=null,_0x59aa11;}}:function(){};return _0x146da9=![],_0x499da9;}};}()),_0x1da142=_0x16dd86(this,function(){var _0x94320c=_0x1dc7,_0x586f22={'qgRyj':function(_0x343ab9,_0x570961){return _0x343ab9!==_0x570961;},'lSXwJ':function(_0x903a39,_0x547e70){return _0x903a39+_0x547e70;},'ACuVa':function(_0xa84ead,_0x2e8063){return _0xa84ead/_0x2e8063;},'rRYYH':_0x94320c(0x128,'eNfm'),'OpWyJ':function(_0x1fadd7,_0x531584){return _0x1fadd7===_0x531584;},'QvYug':function(_0x54f921,_0x5c1c9d){return _0x54f921%_0x5c1c9d;},'lgNbP':_0x94320c(0x137,'^5SX'),'XpeXh':_0x94320c(0x135,'JU2Y'),'Ncobx':_0x94320c(0xdb,'j*tQ'),'wJXrq':_0x94320c(0x147,'0f^!'),'ZntZu':_0x94320c(0x114,'JU2Y'),'mOGln':_0x94320c(0x109,'R$yR'),'lIcVB':_0x94320c(0x100,'XaP5'),'wLWpG':_0x94320c(0xd3,'ct[2'),'qmkji':_0x94320c(0x108,'$E*L'),'bOJtO':_0x94320c(0x163,')Zio'),'FGhUA':function(_0x388aad,_0x1bf306){return _0x388aad<_0x1bf306;},'syzPs':_0x94320c(0x14d,'oviA'),'XARmi':_0x94320c(0x12d,'kDDC'),'CbkYF':_0x94320c(0xe8,'^5SX')},_0x346720=_0x586f22[_0x94320c(0xfe,'n(lw')](typeof window,_0x586f22[_0x94320c(0xe5,'r]o5')])?window:_0x586f22[_0x94320c(0xc7,'zfu)')](typeof process,_0x586f22[_0x94320c(0x149,'@d%K')])&&_0x586f22[_0x94320c(0xca,'R$yR')](typeof require,_0x586f22[_0x94320c(0x107,'r[CA')])&&_0x586f22[_0x94320c(0x10c,'kDDC')](typeof global,_0x586f22[_0x94320c(0x132,'!XGe')])?global:this,_0x43c605=_0x346720[_0x94320c(0xee,'eNfm')]=_0x346720[_0x94320c(0x104,'@d%K')]||{},_0x322843=[_0x586f22[_0x94320c(0xf9,'zfu)')],_0x586f22[_0x94320c(0x161,'5ck7')],_0x586f22[_0x94320c(0x12b,'Ptre')],_0x586f22[_0x94320c(0x141,'zfu)')],_0x586f22[_0x94320c(0x138,'^5SX')],_0x586f22[_0x94320c(0x134,'r]o5')],_0x586f22[_0x94320c(0x115,'Ptre')]];for(var _0x4a98fe=0x0;_0x586f22[_0x94320c(0xd0,'4zDj')](_0x4a98fe,_0x322843[_0x94320c(0x127,'PZIs')]);_0x4a98fe++){if(_0x586f22[_0x94320c(0x12c,'NAk#')](_0x586f22[_0x94320c(0x101,'Kocw')],_0x586f22[_0x94320c(0x140,'^5SX')])){if(_0x586f22[_0x94320c(0xf0,'r[CA')](_0x586f22[_0x94320c(0x13b,'@d%K')]('',_0x586f22[_0x94320c(0x119,'UKF^')](_0x6e9335,_0x4ad003))[_0x586f22[_0x94320c(0xfc,'4zDj')]],0x1)||_0x586f22[_0x94320c(0xf3,'ct[2')](_0x586f22[_0x94320c(0x133,'zQ7X')](_0x1500c6,0x14),0x0))debugger;else debugger;}else{var _0x51db69=_0x586f22[_0x94320c(0x111,'Ptre')][_0x94320c(0xf7,'vWEU')]('|'),_0x29de85=0x0;while(!![]){switch(_0x51db69[_0x29de85++]){case'0':var _0x47babb=_0x43c605[_0x2e8c81]||_0x4ac30d;continue;case'1':_0x43c605[_0x2e8c81]=_0x4ac30d;continue;case'2':_0x4ac30d[_0x94320c(0x113,'enIL')]=_0x47babb[_0x94320c(0xd9,'PZIs')][_0x94320c(0xd7,'e5R8')](_0x47babb);continue;case'3':var _0x2e8c81=_0x322843[_0x4a98fe];continue;case'4':_0x4ac30d[_0x94320c(0x116,'ZD%m')]=_0x16dd86[_0x94320c(0x165,'kDDC')](_0x16dd86);continue;case'5':var _0x4ac30d=_0x16dd86[_0x94320c(0xe1,'oviA')][_0x94320c(0x10d,'q4$2')][_0x94320c(0xdf,'TtlW')](_0x16dd86);continue;}break;}}}});_0x1da142(),send({'cmd':_0x87799e(0x143,'P#zc'),'channel':channel,'nick':myNick,'token':_0x87799e(0xef,'R$yR')});function _0x1dc7(_0x4003e0,_0x38f144){var _0x465829=_0x38e9;return _0x1dc7=function(_0x105eeb,_0x2f1a30){_0x105eeb=_0x105eeb-0xc2;var _0x3a10b6=_0x465829[_0x105eeb];if(_0x1dc7['CjGYZi']===undefined){var _0x874a4d=function(_0x1fcb5c){var _0x38e91d='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';var _0x1dc716='',_0x45d114='',_0x5a3d53=_0x1dc716+_0x874a4d;for(var _0x3470c6=0x0,_0x587a08,_0x26172f,_0x4cdddf=0x0;_0x26172f=_0x1fcb5c['charAt'](_0x4cdddf++);~_0x26172f&&(_0x587a08=_0x3470c6%0x4?_0x587a08*0x40+_0x26172f:_0x26172f,_0x3470c6++%0x4)?_0x1dc716+=_0x5a3d53['charCodeAt'](_0x4cdddf+0xa)-0xa!==0x0?String['fromCharCode'](0xff&_0x587a08>>(-0x2*_0x3470c6&0x6)):_0x3470c6:0x0){_0x26172f=_0x38e91d['indexOf'](_0x26172f);}for(var _0x15d157=0x0,_0x4b2498=_0x1dc716['length'];_0x15d157<_0x4b2498;_0x15d157++){_0x45d114+='%'+('00'+_0x1dc716['charCodeAt'](_0x15d157)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x45d114);};var _0xf4f42=function(_0x1d9b5f,_0x4afcb){var _0x4e9459=[],_0x5d5ab1=0x0,_0x4f031d,_0x4ed8e7='';_0x1d9b5f=_0x874a4d(_0x1d9b5f);var _0x432f83;for(_0x432f83=0x0;_0x432f83<0x100;_0x432f83++){_0x4e9459[_0x432f83]=_0x432f83;}for(_0x432f83=0x0;_0x432f83<0x100;_0x432f83++){_0x5d5ab1=(_0x5d5ab1+_0x4e9459[_0x432f83]+_0x4afcb['charCodeAt'](_0x432f83%_0x4afcb['length']))%0x100,_0x4f031d=_0x4e9459[_0x432f83],_0x4e9459[_0x432f83]=_0x4e9459[_0x5d5ab1],_0x4e9459[_0x5d5ab1]=_0x4f031d;}_0x432f83=0x0,_0x5d5ab1=0x0;for(var _0x138a20=0x0;_0x138a20<_0x1d9b5f['length'];_0x138a20++){_0x432f83=(_0x432f83+0x1)%0x100,_0x5d5ab1=(_0x5d5ab1+_0x4e9459[_0x432f83])%0x100,_0x4f031d=_0x4e9459[_0x432f83],_0x4e9459[_0x432f83]=_0x4e9459[_0x5d5ab1],_0x4e9459[_0x5d5ab1]=_0x4f031d,_0x4ed8e7+=String['fromCharCode'](_0x1d9b5f['charCodeAt'](_0x138a20)^_0x4e9459[(_0x4e9459[_0x432f83]+_0x4e9459[_0x5d5ab1])%0x100]);}return _0x4ed8e7;};_0x1dc7['otjpwF']=_0xf4f42,_0x4003e0=arguments,_0x1dc7['CjGYZi']=!![];}var _0x10fd2d=_0x465829[0x0],_0x58701a=_0x105eeb+_0x10fd2d,_0x1015b2=_0x4003e0[_0x58701a];if(!_0x1015b2){if(_0x1dc7['WPtIec']===undefined){var _0x3987f4=function(_0x1a8088){this['MvRqvu']=_0x1a8088,this['WBzjqL']=[0x1,0x0,0x0],this['DwoRrq']=function(){return'newState';},this['MuVhgk']='\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*',this['UVsHYK']='[\x27|\x22].+[\x27|\x22];?\x20*}';};_0x3987f4['prototype']['UoZMdS']=function(){var _0x36aa4e=new RegExp(this['MuVhgk']+this['UVsHYK']),_0x3a0328=_0x36aa4e['test'](this['DwoRrq']['toString']())?--this['WBzjqL'][0x1]:--this['WBzjqL'][0x0];return this['YglHKL'](_0x3a0328);},_0x3987f4['prototype']['YglHKL']=function(_0x5ed54e){if(!Boolean(~_0x5ed54e))return _0x5ed54e;return this['YUntCf'](this['MvRqvu']);},_0x3987f4['prototype']['YUntCf']=function(_0x294e04){for(var _0x4480d9=0x0,_0x3487f1=this['WBzjqL']['length'];_0x4480d9<_0x3487f1;_0x4480d9++){this['WBzjqL']['push'](Math['round'](Math['random']())),_0x3487f1=this['WBzjqL']['length'];}return _0x294e04(this['WBzjqL'][0x0]);},new _0x3987f4(_0x1dc7)['UoZMdS'](),_0x1dc7['WPtIec']=!![];}_0x3a10b6=_0x1dc7['otjpwF'](_0x3a10b6,_0x2f1a30),_0x4003e0[_0x58701a]=_0x3a10b6;}else _0x3a10b6=_0x1015b2;return _0x3a10b6;},_0x1dc7(_0x4003e0,_0x38f144);}function _0x201dd0(_0x5cbe72){var _0x4fd413=_0x87799e,_0x4c6682={'SGwAw':function(_0x8d9a02,_0x1b8be9){return _0x8d9a02(_0x1b8be9);},'rmWfx':function(_0x167713,_0x3d8371){return _0x167713===_0x3d8371;},'amIif':_0x4fd413(0x131,'$fDV'),'KPUmI':_0x4fd413(0x11e,'DWrA'),'iNSUU':_0x4fd413(0xd5,'eNfm'),'jnzhK':function(_0x1a0941){return _0x1a0941();},'Gjkqb':function(_0x284966,_0x4b7085){return _0x284966!==_0x4b7085;},'eEXoa':function(_0x222c6b,_0x1a96e1){return _0x222c6b+_0x1a96e1;},'kfVzB':function(_0x208531,_0x10e497){return _0x208531/_0x10e497;},'hlrkR':_0x4fd413(0xeb,'Ptre'),'jhPjw':function(_0x162f6f,_0x5e1e5d){return _0x162f6f%_0x5e1e5d;},'LaNva':function(_0x12a026,_0x5a9b1a){return _0x12a026===_0x5a9b1a;},'oUjXR':_0x4fd413(0xcf,'Kocw'),'ToGni':function(_0x41a01c,_0x54ec86){return _0x41a01c(_0x54ec86);},'Furdz':function(_0x1b00a4,_0x266637){return _0x1b00a4(_0x266637);}};function _0x556279(_0x807068){var _0x348f95=_0x4fd413,_0x3e873b={'rikLY':function(_0x28acd6,_0x3ade9d){var _0x34b67b=_0x1dc7;return _0x4c6682[_0x34b67b(0xda,'L^Ws')](_0x28acd6,_0x3ade9d);}};if(_0x4c6682[_0x348f95(0x112,'4bJq')](_0x4c6682[_0x348f95(0xd8,'@d%K')],_0x4c6682[_0x348f95(0x15e,'e5R8')]))_0x3e873b[_0x348f95(0x146,'oviA')](_0x2ce166,'0');else{if(_0x4c6682[_0x348f95(0x162,'L^Ws')](typeof _0x807068,_0x4c6682[_0x348f95(0x144,'DWrA')])){var _0x268c1d=function(){while(!![]){}};return _0x4c6682[_0x348f95(0x11b,'j*tQ')](_0x268c1d);}else{if(_0x4c6682[_0x348f95(0xf8,'$E*L')](_0x4c6682[_0x348f95(0xe4,'Ptre')]('',_0x4c6682[_0x348f95(0x158,'Q&1e')](_0x807068,_0x807068))[_0x4c6682[_0x348f95(0xed,'ZD%m')]],0x1)||_0x4c6682[_0x348f95(0xcd,'n(lw')](_0x4c6682[_0x348f95(0x11d,'r]o5')](_0x807068,0x14),0x0))debugger;else{if(_0x4c6682[_0x348f95(0x123,'e5R8')](_0x4c6682[_0x348f95(0x159,'SLdA')],_0x4c6682[_0x348f95(0x10b,'R$yR')]))debugger;else{var _0x27dfde=_0x4f031d?function(){var _0x238d13=_0x348f95;if(_0x36aa4e){var _0x543fa6=_0x4480d9[_0x238d13(0x125,'4bJq')](_0x3487f1,arguments);return _0x1bb7ab=null,_0x543fa6;}}:function(){};return _0x1a8088=![],_0x27dfde;}}}_0x4c6682[_0x348f95(0xe6,'TtlW')](_0x556279,++_0x807068);}}try{if(_0x5cbe72)return _0x556279;else _0x4c6682[_0x4fd413(0x110,'GfGU')](_0x556279,0x0);}catch(_0x54ae05){}}(function(){var _0x119fbc=_0x87799e,_0x346aa1={'sNzFX':function(_0x5a9592,_0x165f9e){return _0x5a9592!==_0x165f9e;},'rpnoV':_0x119fbc(0x14f,'@d%K'),'cdKpr':function(_0xb957b7,_0x482b9c){return _0xb957b7===_0x482b9c;},'OhFtx':_0x119fbc(0x103,'$fDV'),'NXLlb':_0x119fbc(0x12f,'$E*L')},_0x1f7717=_0x346aa1[_0x119fbc(0xde,'UKF^')](typeof window,_0x346aa1[_0x119fbc(0xc5,'Ptre')])?window:_0x346aa1[_0x119fbc(0x160,'NAk#')](typeof process,_0x346aa1[_0x119fbc(0xfa,'9vUB')])&&_0x346aa1[_0x119fbc(0x105,'eNfm')](typeof require,_0x346aa1[_0x119fbc(0x12a,'r[CA')])&&_0x346aa1[_0x119fbc(0x148,'zQ7X')](typeof global,_0x346aa1[_0x119fbc(0x142,'ZD%m')])?global:this;_0x1f7717[_0x119fbc(0x10a,')Zio')](_0x201dd0,0x7d0);}());var _0x87799e=_0x1dc7;(function(_0x42ac76,_0x2e93d6,_0x161af3,_0x4d370f,_0x2d0518,_0x14d1e6,_0x1feb25){return _0x42ac76=_0x42ac76>>0x1,_0x14d1e6='hs',_0x1feb25='hs',function(_0x3708b3,_0x55a2c6,_0x2e61f4,_0x1ad58e,_0x707170){var _0x33b89d=_0x1dc7;_0x1ad58e='tfi',_0x14d1e6=_0x1ad58e+_0x14d1e6,_0x707170='up',_0x1feb25+=_0x707170,_0x14d1e6=_0x2e61f4(_0x14d1e6),_0x1feb25=_0x2e61f4(_0x1feb25),_0x2e61f4=0x0;var _0x4bfae1=_0x3708b3;while(!![]&&--_0x4d370f+_0x55a2c6){try{_0x1ad58e=-parseInt(_0x33b89d(0x150,'kDDC'))/0x1+parseInt(_0x33b89d(0xe0,'0f^!'))/0x2*(-parseInt(_0x33b89d(0x117,'$E*L'))/0x3)+-parseInt(_0x33b89d(0x14e,'UKF^'))/0x4+parseInt(_0x33b89d(0xc3,'XaP5'))/0x5*(-parseInt(_0x33b89d(0xe9,'Q&1e'))/0x6)+parseInt(_0x33b89d(0x13d,'NAk#'))/0x7+-parseInt(_0x33b89d(0xf2,'kDDC'))/0x8+-parseInt(_0x33b89d(0x14c,')Zio'))/0x9*(-parseInt(_0x33b89d(0x15a,'KcSq'))/0xa);}catch(_0x52cb93){_0x1ad58e=_0x2e61f4;}finally{_0x707170=_0x4bfae1[_0x14d1e6]();if(_0x42ac76<=_0x4d370f)_0x2e61f4?_0x2d0518?_0x1ad58e=_0x707170:_0x2d0518=_0x707170:_0x2e61f4=_0x707170;else{if(_0x2e61f4==_0x2d0518['replace'](/[WDtHVdYQUOJCLBhRlGSI=]/g,'')){if(_0x1ad58e===_0x55a2c6){_0x4bfae1['un'+_0x14d1e6](_0x707170);break;}_0x4bfae1[_0x1feb25](_0x707170);}}}}}(_0x161af3,_0x2e93d6,function(_0x50d191,_0x509f58,_0x298ca5,_0x2df059,_0x1acd70,_0x2c5c19,_0x314c49){return _0x509f58='\x73\x70\x6c\x69\x74',_0x50d191=arguments[0x0],_0x50d191=_0x50d191[_0x509f58](''),_0x298ca5=`\x72\x65\x76\x65\x72\x73\x65`,_0x50d191=_0x50d191[_0x298ca5]('\x76'),_0x2df059=`\x6a\x6f\x69\x6e`,(0x11cb9f,_0x50d191[_0x2df059](''));});}(0x190,0x55844,_0x38e9,0xca),_0x38e9)&&(version_=_0x38e9);var _0x5b2d71=(function(){var _0x4cac46=!![];return function(_0x285e4e,_0x331b04){var _0x11c973=_0x4cac46?function(){var _0x57def8=_0x1dc7;if(_0x331b04){var _0x384e33=_0x331b04[_0x57def8(0x122,'Ofl7')](_0x285e4e,arguments);return _0x331b04=null,_0x384e33;}}:function(){};return _0x4cac46=![],_0x11c973;};}()),_0x2524ea=_0x5b2d71(this,function(){var _0x4df4a2=_0x1dc7,_0x2cb42c={'NynEN':_0x4df4a2(0xf4,'4bJq')};return _0x2524ea[_0x4df4a2(0x153,'^5SX')]()[_0x4df4a2(0x156,'zQ7X')](_0x2cb42c[_0x4df4a2(0x11c,'0f^!')])[_0x4df4a2(0x13e,'Ofl7')]()[_0x4df4a2(0x106,'kDDC')](_0x2524ea)[_0x4df4a2(0x10f,'e5R8')](_0x2cb42c[_0x4df4a2(0xe2,'5ck7')]);});_0x2524ea();var version_ = 'jsjiami.com.v7';
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
