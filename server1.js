const { Client, RichEmbed } = require('discord.js');
const yt = require('ytdl-core');
const tokens = require('./tokens.json');
const client = new Client();

let queue = {};

// Ready event
client.on('ready', () => 
{
	console.log('ready!');
});

// Message event
client.on('message', msg => 
{
    while (true)
    {

    }
});

client.login(tokens.d_token);
