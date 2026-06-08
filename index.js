require("dotenv").config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const lanes = require("./lanes.json");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

let champions = [];

// チャンプ取得
async function loadChampions() {
  const res = await axios.get(
    "https://ddragon.leagueoflegends.com/cdn/14.1.1/data/ja_JP/champion.json"
  );

  champions = Object.values(res.data.data).map(c => ({
    ja: c.name,
    en: c.id
  }));
}

function random(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function img(name) {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${name}_0.jpg`;
}

// レーン別抽選（日本語名対応）
function pickByLane(lane) {
  const pool = champions.filter(c =>
    lanes[lane]?.includes(c.ja)
  );

  if (!pool.length) return null;

  return random(pool);
}

// 重複なし5レーン抽選
function pickUniqueByLane() {
  const used = new Set();

  function pick(lane) {
    const pool = champions.filter(
      c =>
        lanes[lane]?.includes(c.ja) &&
        !used.has(c.ja)
    );

    const champ = random(pool);

    if (champ) {
      used.add(champ.ja);
    }

    return champ;
  }

  return {
    top: pick("top"),
    jg: pick("jg"),
    mid: pick("mid"),
    adc: pick("adc"),
    sup: pick("sup")
  };
}

// コマンド
const commands = [
  new SlashCommandBuilder().setName("top").setDescription("TOP抽選"),
  new SlashCommandBuilder().setName("jg").setDescription("JG抽選"),
  new SlashCommandBuilder().setName("mid").setDescription("MID抽選"),
  new SlashCommandBuilder().setName("adc").setDescription("ADC抽選"),
  new SlashCommandBuilder().setName("sup").setDescription("SUP抽選"),

  new SlashCommandBuilder().setName("team").setDescription("5レーン一括抽選"),
  new SlashCommandBuilder().setName("random").setDescription("全チャンプから抽選")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    await loadChampions();

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );

    console.log("コマンド登録完了");
  } catch (err) {
    console.error(err);
  }
})();

client.once("ready", () => {
  console.log(`ログイン: ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // 全チャンプランダム
  if (interaction.commandName === "all") {
    const champ = random(champions);

    const embed = new EmbedBuilder()
      .setTitle("🎲 ランダムチャンプ")
      .setDescription(champ.ja)
      .setImage(img(champ.en));

    return interaction.reply({ embeds: [embed] });
  }

  // 5レーン一括
  if (interaction.commandName === "team") {
    const team = pickUniqueByLane();

    const embed = new EmbedBuilder()
      .setTitle("🎲 チーム抽選")
      .setDescription(
        `🛡 TOP : ${team.top?.ja ?? "なし"}\n` +
        `🌲 JG : ${team.jg?.ja ?? "なし"}\n` +
        `✨ MID : ${team.mid?.ja ?? "なし"}\n` +
        `🏹 ADC : ${team.adc?.ja ?? "なし"}\n` +
        `💚 SUP : ${team.sup?.ja ?? "なし"}`
      );

    return interaction.reply({ embeds: [embed] });
  }

  // レーン別
  const champ = pickByLane(interaction.commandName);

  if (!champ) {
    return interaction.reply({
      content: "そのレーンのチャンピオンが登録されていません。",
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(`🎲 ${interaction.commandName.toUpperCase()}`)
    .setDescription(champ.ja)
    .setImage(img(champ.en));

  return interaction.reply({ embeds: [embed] });
});

 console.log("TOKEN exists:", !!TOKEN);
console.log("TOKEN length:", TOKEN?.length);
console.log("CLIENT_ID:", CLIENT_ID);

client.login(TOKEN);