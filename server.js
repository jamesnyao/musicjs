const { Client, RichEmbed } = require('discord.js');
const yt = require('ytdl-core');
const tokens = require('./tokens.json');
const client = new Client();

let queue = {};

// Commands
const commands =
{
    // Command: start
    'start': (msg) =>
    {
        let dispatcher;
        queue[msg.guild.id].playing = true;

        console.log(queue);

        while (true)
        {
            // Wait on no song in queue
            if (queue[msg.guild.id] === undefined) continue;

            // Function for playing song
            (function play(song) 
            {
                console.log(song);
                
                msg.channel.sendMessage(`Playing: **${song.title}** as requested by: **${song.requester}**`);

                // YT player
                dispatcher = msg.guild.voiceConnection.playStream(yt(song.url, { audioonly: true }), { passes : tokens.passes });

                let collector = msg.channel.createCollector(m => m);

                collector.on('message', m => 
                {
                    if (m.content.startsWith(tokens.prefix + 'pause'))
                    {
                        msg.channel.sendMessage('paused').then(() => {dispatcher.pause();});
                    }
                    else if (m.content.startsWith(tokens.prefix + 'resume'))
                    {
                        msg.channel.sendMessage('resumed').then(() => {dispatcher.resume();});
                    }
                    else if (m.content.startsWith(tokens.prefix + 'skip'))
                    {
                        msg.channel.sendMessage('skipped').then(() => {dispatcher.end();});
                    }
                    else if (m.content.startsWith(tokens.prefix + 'volume'))
                    {
                        if (parseInt(m.content.split(' ')[1]) >= 100)
                        {
                            dispatcher.setVolume(2);
                            msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume*50)}%`);
                        }
                        else
                        {
                            dispatcher.setVolume(parseInt(m.content.split(' ')[1])/50);
                            msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume*50)}%`);
                        }
                    }
                    else if (m.content.startsWith(tokens.prefix + 'time'))
                    {
                        let time;
                        if (Math.floor((dispatcher.time % 60000)/1000) < 10)
                        {
                            time = '0' + Math.floor((dispatcher.time % 60000)/1000);
                        }
                        else
                        {
                            time = Math.floor((dispatcher.time % 60000)/1000);
                        }
                        msg.channel.sendMessage(`time: ${Math.floor(dispatcher.time / 60000)}:${time}`);
                    }
                });

                // play next song
                dispatcher.on('end', () =>
                {
                    collector.stop();
                });

                // error on getting next song
                dispatcher.on('error', (err) =>
                {
                    msg.channel.sendMessage('error: ' + err).then(() =>
                    {
                        collector.stop();
                    });
                });
            })(queue[msg.guild.id].songs.shift());
        }
    },

    // Command: join
	'join': (msg) =>
	{
		return new Promise((resolve, reject) =>
		{
			const voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel || voiceChannel.type !== 'voice')
			{
				msg.reply('I couldn\'t connect to your voice channel...');
				return;
			}
			voiceChannel.join().then(connection => resolve(connection)).catch(err => reject(err));
		});
    },

    // Command: add
	'play': (msg) =>
	{
		let url = msg.content.split(' ')[1];
		if (url == '' || url === undefined)
		{
			msg.channel.sendMessage(`Play song: You must add a YouTube video url or id after ${tokens.prefix}play`);
			return;
		}
		yt.getInfo(url, (err, info) =>
		{
			if (err)
			{
				msg.channel.sendMessage('Invalid YouTube Link: ' + err);
				return;
			}
			if (!queue.hasOwnProperty(msg.guild.id))
			{
				queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];
			}
			queue[msg.guild.id].songs.push({url: url, title: info.title, requester: msg.author.username});
			msg.channel.sendMessage(`Add song: added **${info.title}** to the queue`);
		});
	},
    
    // Command: queue
	'queue': (msg) =>
	{
		if (queue[msg.guild.id] === undefined)
		{
			msg.channel.sendMessage(`Add some songs to the queue first with ${tokens.prefix}play`);
			return;
		}
		let tosend = [];
		queue[msg.guild.id].songs.forEach((song, i) =>
		{
			tosend.push(`${i+1}. ${song.title} - Requested by: ${song.requester}`);
		});
		msg.channel.sendMessage(`__**${msg.guild.name}'s Music Queue:**__ Currently **${tosend.length}** songs queued ${(tosend.length > 15 ? '*[Only next 15 shown]*' : '')}\n\`\`\`${tosend.slice(0,15).join('\n')}\`\`\``);
    },
    
    // Command: leave
	'leave': (msg) =>
	{
		msg.member.voiceChannel.leave();
    },
    
    // Command: help
	'help': (msg) =>
	{
		let tosend =
		[
			tokens.prefix + 'join : join voice channel of msg sender',
			tokens.prefix + 'play : play song or add song to the queue (song must be YouTube link)',
            tokens.prefix + 'queue : show the current queue, up to 15 songs shown',
            tokens.prefix + 'leave : leave voice channel',
			'',
			'the following commands only function while the play command is running:'.toUpperCase(),
			tokens.prefix + 'pause : pauses the music',
			tokens.prefix + 'resume : resumes the music',
			tokens.prefix + 'skip : skips the playing song',
			tokens.prefix + 'time : shows the playtime of the song',
			tokens.prefix + 'volume <0-100> : sets the volume to <0-100>%'
		];
		msg.channel.sendEmbed(new RichEmbed().addField('Help', tosend.join('\n')));
	},

	// Command: reboot
	'reboot': (msg) => {
		if (msg.author.id == tokens.adminID)
		{
			process.exit(); //Requires a node module like Forever to work.
		}
	}
}

// Ready event
client.on('ready', () => 
{
	console.log('ready!');
});

// Message event
client.on('message', msg => 
{
	// console.log(msg.content);

	// No token before message
	if (!msg.content.startsWith(tokens.prefix))
	{
		if (!msg.author.bot)
		{
			if (responses.hasOwnProperty(msg.content.toLowerCase().split(' ')[0]))
			{
				responses[msg.content.toLowerCase().split(' ')[0]](msg);
			}
		}
		return;
	}

	// Token before message
	if (commands.hasOwnProperty(msg.content.toLowerCase().slice(tokens.prefix.length).split(' ')[0]))
	{
		commands[msg.content.toLowerCase().slice(tokens.prefix.length).split(' ')[0]](msg);
	}
});

client.login(tokens.d_token);
