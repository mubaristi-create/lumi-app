(function(g){'use strict';
const entries=[
 ['Sakura Bağları','#154b3c','#92d5a7','🌸🍀🦋🎋🪷🍒','Çiçəklər arasında ilk macəra'],
 ['Okean Aləmi','#07345b','#55d2da','🐚🐠🐙🪼🦀⭐','Mavi dərinliklərin sirri'],
 ['Konfet Vadisi','#5c2049','#f7a9d4','🍬🍭🧁🍩🍪🍫','Şirin kəşflərə doğru'],
 ['Səma Adaları','#172553','#9ecfff','🌙⭐🪐🚀☄️🛸','Ulduzlar arasında səyahət'],
 ['Kristal Krallığı','#30205e','#c3a0ff','💎🔮🗝️🪄👑⚜️','Parıldayan xəzinəni tap'],
 ['Meyvə Bağları','#4a2713','#ffc777','🍎🍊🍇🍓🍉🍋','Rəngli bağların dadı'],
 ['Vəhşi Təbiət','#183f2a','#a8da76','🦊🐼🐯🦁🐨🦉','Yeni dostlarla tanış ol'],
 ['Gələcəyin Şəhəri','#102f44','#79e8fa','🤖💻🎮⚙️💡📡','Texnologiyanın ritmini tut'],
 ['Qədim Sirlər','#482817','#e7bc74','🏺📜🏛️🧭⚱️🪙','Keçmişin izlərini birləşdir'],
 ['Əfsanələr Dünyası','#351d47','#ffadcd','🐉🦄🧚🍄🏰🧝','Son sehrli macəran']
];
const worlds=entries.map((a,i)=>({id:i+1,name:a[0],dark:a[1],color:a[2],icons:Array.from(a[3]),subtitle:a[4],range:[i*40+1,i*40+40]}));
// Explicit arrays keep multi-codepoint emoji together.
worlds[1].icons=['🐚','🐠','🐙','🪼','🦀','⭐'];worlds[3].icons=['🌙','⭐','🪐','🚀','☄️','🛸'];worlds[4].icons=['💎','🔮','🗝️','🪄','👑','⚜️'];worlds[7].icons=['🤖','💻','🎮','⚙️','💡','📡'];worlds[8].icons=['🏺','📜','🏛️','🧭','⚱️','🪙'];
worlds.forEach((w,i)=>w.icons=[["🌸","🍀","🦋","🏮","🎀","🎋","🪷","🌊","🌻","🌹","🍃","🍇","🍒","💧","❄️","🔥","🌙","⭐"],["🪸","🐋","🐬","🐟","🐡","🐠","🦈","🐙","🦑","🪼","🦞","🦀","🐚","🦐","🐢","🦭","🦦","⭐"],["🍬","🍭","🧁","🍩","🍪","🍫","🍰","🎂","🍮","🍯","🍦","🍨","🍡","🍧","🥐","🧇","🥨","🥞"],["🌙","⭐","🪐","🚀","☄️","🛸","🌎","🌞","🌌","🔭","🛰️","👩‍🚀","🌠","🌕","🌑","💫","🧑‍🚀","👽"],["💎","🔮","🗝️","🪄","👑","⚜️","🏰","🛡️","⚔️","📿","🧿","🪬","🕯️","🏆","💍","🎁","🔱","📜"],["🍎","🍊","🍇","🍓","🍉","🍋","🍌","🍍","🥝","🍒","🥭","🍑","🍐","🫐","🥥","🍈","🥑","🌰"],["🦊","🐼","🐯","🦁","🐨","🦉","🐸","🐵","🐰","🐻","🐷","🐮","🦋","🐞","🦒","🐘","🦓","🦔"],["🤖","💻","🎮","⚙️","💡","📡","🔋","📱","⌚","🖨️","🖱️","📷","🎧","🔌","💾","🔬","🧲","🛠️"],["🏺","📜","🏛️","🧭","⚱️","🪙","🗿","⛩️","🛕","🏰","🪔","⚖️","🗝️","🛡️","⚔️","👑","📿","🔱"],["🐉","🦄","🧚","🍄","🏰","🧝","🔮","🪄","🧜","🦅","🪶","🌈","🧙","🧞","💎","🪷","🦚","🦢"]][i]);
const world=level=>worlds[Math.min(9,Math.max(0,Math.floor((level-1)/40)))];
function art(w){const decorations=w.icons.map((x,i)=>`<text x="${70+(i%3)*160}" y="${140+Math.floor(i/3)*290}" font-size="76" opacity=".17">${x}</text>`).join('');return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="800" viewBox="0 0 480 800"><defs><radialGradient id="g"><stop stop-color="${w.color}" stop-opacity=".55"/><stop offset="1" stop-color="${w.dark}"/></radialGradient></defs><rect width="480" height="800" fill="${w.dark}"/><rect width="480" height="800" fill="url(#g)"/>${decorations}<path d="M0 720 Q130 550 270 690T480 630V800H0" fill="${w.color}" opacity=".15"/></svg>`)}
g.LumiTilesWorlds={worlds,world,art,symbol:(level,symbol,index)=>{const w=world(level);return w.icons[index%w.icons.length]||'⭐'}};
})(globalThis);
