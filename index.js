const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

// 環境変数の読み込み方を正しい記述（文字列のキー）に修正しました
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let champions = [];

// チャンプ取得
async function loadChampions() {
  const res = await axios.get("https://ddragon.leagueoflegends.com/cdn/14.1.1/data/ja_JP/champion.json");

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

// コマンド
const commands = [
  new SlashCommandBuilder().setName("top").setDescription("TOPスピン"),
  new SlashCommandBuilder().setName("mid").setDescription("MIDスピン"),
  new SlashCommandBuilder().setName("jg").setDescription("JGスピン"),
  new SlashCommandBuilder().setName("adc").setDescription("ADCスピン"),
  new SlashCommandBuilder().setName("sup").setDescription("SUPスピン"),
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  await loadChampions();

  await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    { body: commands }
  );
})();

client.once("ready", () => {
  console.log("Bot起動");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const champ = random(champions);

  const embed = new EmbedBuilder()
    .setTitle(`🎲 ${interaction.commandName}`)
    .setDescription(champ.ja)
    .setImage(img(champ.en));

  interaction.reply({ embeds: [embed] });
});

client.login(TOKEN);