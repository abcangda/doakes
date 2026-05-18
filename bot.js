const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
} = require("discord.js");

const Database = require("better-sqlite3");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

// ================= DB =================
const db = new Database("db.db");

db.exec(`
CREATE TABLE IF NOT EXISTS messages (
  user_id TEXT,
  content TEXT,
  timestamp INTEGER
);

CREATE TABLE IF NOT EXISTS edges (
  a TEXT,
  b TEXT,
  weight REAL
);
`);

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ================= SAVE MESSAGES =================
client.on("messageCreate", msg => {
  if (msg.author.bot) return;

  db.prepare(`
    INSERT INTO messages (user_id, content, timestamp)
    VALUES (?, ?, ?)
  `).run(msg.author.id, msg.content || "", Date.now());
});

// ================= GET MESSAGES =================
function getMessages(id) {
  return db.prepare(`
    SELECT content FROM messages
    WHERE user_id = ?
    ORDER BY timestamp DESC
    LIMIT 120
  `).all(id).map(m => m.content || "");
}

// ================= IA VECTOR =================
function vector(msgs) {
  const text = msgs.join(" ").toLowerCase();

  const words = text
    .replace(/[^a-z0-9áéíóúñ ]/gi, " ")
    .split(/\s+/)
    .filter(w => w.length > 3);

  const freq = {};

  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  return {
    avgLen: msgs.reduce((a, m) => a + m.length, 0) / (msgs.length || 1),
    unique: Object.keys(freq).length,
    top: Object.entries(freq)
      .sort((a,b)=>b[1]-a[1])
      .slice(0,10)
      .map(x=>x[0]),
    caps: (text.match(/[A-Z]/g)||[]).length / (text.length || 1)
  };
}

// ================= SIMILITUD =================
function similarity(a,b){
  const A = new Set(a.top);
  const B = new Set(b.top);

  const inter = [...A].filter(x=>B.has(x));

  let s = inter.length / 10;

  if (Math.abs(a.avgLen - b.avgLen) < 10) s += 0.2;
  if (Math.abs(a.unique - b.unique) < 20) s += 0.2;
  if (Math.abs(a.caps - b.caps) < 0.05) s += 0.1;

  return Math.min(s,1);
}

// ================= EDGE =================
function link(a,b,w){
  db.prepare(`
    INSERT INTO edges (a,b,weight)
    VALUES (?,?,?)
  `).run(a,b,w);
}

// ================= SCORE =================
function score(user, other, A, B){

  let s = 0;
  const r = [];

  const age = (Date.now()-user.createdTimestamp)/86400000;

  if(age < 7){s+=35;r.push("cuenta muy nueva");}
  else if(age < 30){s+=15;r.push("cuenta reciente");}

  const v1 = vector(A);
  const v2 = vector(B);

  const sim = similarity(v1,v2);

  s += sim * 70;

  if(sim > 0.4) r.push("estilo similar");
  if(sim > 0.6) r.push("posible misma persona");

  const nameMatch =
    user.username?.slice(0,4).toLowerCase() ===
    other.username?.slice(0,4).toLowerCase();

  if(nameMatch){
    s += 15;
    r.push("username similar");
  }

  s = Math.min(100,Math.round(s));

  let level = "bajo";
  if(s >= 70) level = "alto";
  else if(s >= 40) level = "medio";

  return {s,level,r};
}

// ================= EMBED SAFE =================
function embed(user,res,a,b){

  return new EmbedBuilder()
    .setTitle("analisis de alt (ia)")
    .setColor(res.level==="alto"?0xe74c3c:res.level==="medio"?0xf1c40f:0x2ecc71)
    .addFields(
      {name:"usuario",value:String(user.tag),inline:true},
      {name:"riesgo",value:`${res.s}%`,inline:true},
      {name:"nivel",value:res.level,inline:true},
      {name:"mensajes",value:`${a} vs ${b}`},
      {name:"razones",value:res.r.length?res.r.join("\n"):"sin señales"}
    )
    .setTimestamp();
}

// ================= COMMANDS =================
const commands = [
  new SlashCommandBuilder()
    .setName("alt")
    .setDescription("analiza usuario")
    .addUserOption(o=>o.setName("usuario").setRequired(true)),

  new SlashCommandBuilder()
    .setName("compare")
    .setDescription("compara usuarios")
    .addUserOption(o=>o.setName("u1").setRequired(true))
    .addUserOption(o=>o.setName("u2").setRequired(true))
].map(c=>c.toJSON());

const rest = new REST({version:"10"}).setToken(TOKEN);

(async()=>{
  await rest.put(Routes.applicationCommands(CLIENT_ID),{body:commands});
})();

// ================= EVENTS =================
client.once("ready",()=>console.log("bot online"));

client.on("interactionCreate",async i=>{
  if(!i.isChatInputCommand()) return;

  if(i.commandName==="alt"){

    const u = i.options.getUser("usuario");

    const A = getMessages(u.id);

    const other = i.guild.members.cache.find(m=>
      m.user.id!==u.id &&
      m.user.username?.slice(0,4).toLowerCase()===
      u.username?.slice(0,4).toLowerCase()
    );

    const B = other ? getMessages(other.user.id) : [];

    const res = score(u,other||u,A,B);

    if(other) link(u.id,other.user.id,res.s);

    return i.reply({embeds:[embed(u,res,A.length,B.length)]});
  }

  if(i.commandName==="compare"){

    const u1=i.options.getUser("u1");
    const u2=i.options.getUser("u2");

    const m1=getMessages(u1.id);
    const m2=getMessages(u2.id);

    const v1=vector(m1);
    const v2=vector(m2);

    const sim=similarity(v1,v2)*100;

    return i.reply({
      embeds:[
        new EmbedBuilder()
          .setTitle("compare ia")
          .setColor(sim>70?0xe74c3c:sim>40?0xf1c40f:0x2ecc71)
          .addFields(
            {name:"u1",value:u1.tag,inline:true},
            {name:"u2",value:u2.tag,inline:true},
            {name:"similitud",value:`${sim.toFixed(1)}%`}
          )
      ]
    });
  }
});

client.login(TOKEN);
