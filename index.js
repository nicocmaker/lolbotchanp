const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

const TOKEN = process.env.MTUxMjkxNTA1MjYzMjYwNDg2Mg.GCkgoq.B9ezmzhFDBX0ofWtixnuEu_lveysIVG67feWuk;
const CLIENT_ID = process.env.1512915052632604862;

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