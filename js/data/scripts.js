/* ===== Écriture : hiragana, katakana, kanji ===== */
const toKata=s=>s.replace(/[ぁ-ゖ]/g,c=>String.fromCharCode(c.charCodeAt(0)+0x60));
const parseRows=rows=>rows.map(r=>r.split(" ").map(x=>x==="-"?null:{c:x.split(":")[0],ro:x.split(":")[1]}));
const HBASE=parseRows(["あ:a い:i う:u え:e お:o","か:ka き:ki く:ku け:ke こ:ko","さ:sa し:shi す:su せ:se そ:so","た:ta ち:chi つ:tsu て:te と:to","な:na に:ni ぬ:nu ね:ne の:no","は:ha ひ:hi ふ:fu へ:he ほ:ho","ま:ma み:mi む:mu め:me も:mo","や:ya - ゆ:yu - よ:yo","ら:ra り:ri る:ru れ:re ろ:ro","わ:wa - - - を:o","ん:n - - - -"]);
const HDAK=parseRows(["が:ga ぎ:gi ぐ:gu げ:ge ご:go","ざ:za じ:ji ず:zu ぜ:ze ぞ:zo","だ:da ぢ:ji づ:zu で:de ど:do","ば:ba び:bi ぶ:bu べ:be ぼ:bo","ぱ:pa ぴ:pi ぷ:pu ぺ:pe ぽ:po"]);
const HCOMB=parseRows(["きゃ:kya きゅ:kyu きょ:kyo","ぎゃ:gya ぎゅ:gyu ぎょ:gyo","しゃ:sha しゅ:shu しょ:sho","じゃ:ja じゅ:ju じょ:jo","ちゃ:cha ちゅ:chu ちょ:cho","にゃ:nya にゅ:nyu にょ:nyo","ひゃ:hya ひゅ:hyu ひょ:hyo","びゃ:bya びゅ:byu びょ:byo","ぴゃ:pya ぴゅ:pyu ぴょ:pyo","みゃ:mya みゅ:myu みょ:myo","りゃ:rya りゅ:ryu りょ:ryo"]);
const kataRows=rows=>rows.map(r=>r.map(x=>x&&{c:toKata(x.c),ro:x.ro==="o"&&x.c==="を"?"o":x.ro}));
const KJ=[["一","いち","ichi","un"],["二","に","ni","deux"],["三","さん","san","trois"],["四","よん / し","yon / shi","quatre"],["五","ご","go","cinq"],
["六","ろく","roku","six"],["七","なな / しち","nana / shichi","sept"],["八","はち","hachi","huit"],["九","きゅう / く","kyū / ku","neuf"],["十","じゅう","jū","dix"],
["百","ひゃく","hyaku","cent"],["千","せん","sen","mille"],["万","まん","man","dix mille"],["円","えん","en","yen, cercle"],["人","ひと / じん","hito / jin","personne"],
["日","にち / ひ","nichi / hi","jour, soleil"],["月","げつ / がつ","getsu / gatsu","lune, mois"],["火","か / ひ","ka / hi","feu"],["水","すい / みず","sui / mizu","eau"],["木","もく / き","moku / ki","arbre, bois"],
["金","きん","kin","or, argent"],["土","ど","do","terre"],["曜","よう","yō","jour de la semaine"],["時","じ","ji","heure"],["分","ふん","fun","minute"],
["半","はん","han","moitié"],["今","いま","ima","maintenant"],["何","なに / なん","nani / nan","quoi"],["春","はる","haru","printemps"],["夏","なつ","natsu","été"],
["秋","あき","aki","automne"],["冬","ふゆ","fuyu","hiver"],["雪","ゆき","yuki","neige"],["赤","あか","aka","rouge"],["白","しろ","shiro","blanc"],
["黒","くろ","kuro","noir"],["青","あお","ao","bleu"],["色","いろ","iro","couleur"],["車","くるま","kuruma","voiture"],["父","ちち","chichi","père"],
["母","はは","haha","mère"],["子","こ","ko","enfant"],["本","ほん","hon","livre, origine"],["学","がく","gaku","étude"],["生","せい","sei","vie, naître"],
["食","た(べる)","ta(beru)","manger"],["飲","の(む)","no(mu)","boire"],["見","み(る)","mi(ru)","voir"],["駅","えき","eki","gare"],["電","でん","den","électricité"]];
const SCR={
 hira:{name:"Hiragana",k:"あ",secs:[{t:null,rows:HBASE,cols:5},{t:"Dakuon et handakuon",sub:"Ajoute un symbole pour modifier le son",rows:HDAK,cols:5},{t:"Combinaisons",sub:"Ajoute un petit ゃ ゅ ょ pour créer de nouvelles syllabes",rows:HCOMB,cols:3}]},
 kata:{name:"Katakana",k:"ア",secs:[{t:null,rows:kataRows(HBASE),cols:5},{t:"Dakuon et handakuon",sub:"Ajoute un symbole pour modifier le son",rows:kataRows(HDAK),cols:5},{t:"Combinaisons",sub:"Ajoute un petit ャ ュ ョ pour créer de nouvelles syllabes",rows:kataRows(HCOMB),cols:3}]},
 kanji:{name:"Kanji",k:"漢",secs:[{t:null,rows:(()=>{const r=[];for(let i=0;i<KJ.length;i+=4)r.push(KJ.slice(i,i+4).map(a=>({c:a[0],kana:a[1],ro:a[2],fr:a[3]})));return r;})(),cols:4}]}
};
Object.values(SCR).forEach(s=>{s.list=s.secs.flatMap(x=>x.rows.flat()).filter(Boolean);});
