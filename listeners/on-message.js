/*
 * @Author: Peanut
 * @Description:  处理用户消息
 * @Date: 2020-05-20 22:36:28
 * @Last Modified by: Peanut
 * @Last Modified time: 2021-04-19 22:02:53
 */
const path = require("path");
const { FileBox } = require("file-box");
const superagent = require("../superagent");
const config = require("../config");
const { colorRGBtoHex, colorHex } = require("../utils");

const allKeywords = `哇～好久不见呀～我是仙女的小助理～仙女现在在忙～有什么小助理可以帮到您的吗
1：购买水果
2：进入福利群
3：紧急联系仙女`;
/**
 * sleep
 * @param {*} ms
 */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
/**
 * 处理消息
 */
async function onMessage(msg, bot) {
  //防止自己和自己对话
  if (msg.self()) return;
  const room = msg.room(); // 是否是群消息
  // if (!room) return;
  if (room) {
    //处理群消息
    await onWebRoomMessage(msg, bot);
  } else {
    //处理用户消息  用户消息暂时只处理文本消息。后续考虑其他
    console.log("bot.Message", bot.Message);
    const isText = msg.type() === bot.Message.Type.Text;
    if (isText) {
      await onPeopleMessage(msg, bot);
    }
  }
}
/**
 * 处理用户消息
 */
async function onPeopleMessage(msg, bot) {
  //获取发消息人
  const contact = msg.talker();
  //对config配置文件中 ignore的用户消息不必处理
  if (config.IGNORE.includes(contact.payload.name)) return;
  let content = msg.text().trim(); // 消息内容 使用trim()去除前后空格

  if (content === "菜单") {
    await delay(200);
    await msg.say(allKeywords);
  } else if (content === "打赏") {
    //这里换成自己的赞赏二维码
    const fileBox = FileBox.fromFile(path.join(__dirname, "../imgs/pay.png"));
    await msg.say("我是秦始皇，打钱!!!!!");
    await delay(200);
    await msg.say(fileBox);
  } else if (content === "进入福利群" || parseInt(content) === 2) {
    const webRoom = await bot.Room.find({
      topic: config.WEBROOM
    });
    if (webRoom && contact) {
      if (await webRoom.has(contact)) {
        await delay(200)
        await msg.say('你已经在群里了哦')
      } else {
        try {
          await delay(200);
          await webRoom.add(contact);
        } catch (e) {
          console.error(e);
        }
      }
    }
  } else if (content === "购买水果" || parseInt(content) === 1) {
    const fileBox = FileBox.fromFile(path.join(__dirname, "../imgs/shoping.png"))
    await delay(200);
    await msg.say(fileBox);
  } else if (content === "紧急联系仙女" || parseInt(content) === 3) {
    await delay(200);
    await msg.say('13263205521');
  } else {
    const noUtils = await onUtilsMessage(msg, bot);
    if (noUtils) {
      try {
        await delay(200);
        // console.log(bot.Room)
        await msg.say(allKeywords);
      } catch (error) {
        console.log(error)
      }
    }
  }
}
/**
 * 处理群消息
 */
async function onWebRoomMessage(msg, bot) {
  const isText = msg.type() === bot.Message.Type.Text;
  if (isText) {
    const content = msg.text().trim(); // 消息内容
    if (content === "毒鸡汤") {
      let poison = await superagent.getSoup();
      await delay(200);
      await msg.say(poison);
    } else if (content === "英语一句话") {
      const res = await superagent.getEnglishOne();
      await delay(200);
      await msg.say(`en：${res.en}<br><br>zh：${res.zh}`);
    } else {
      await onUtilsMessage(msg, bot);
    }
  }
}

/**
 * utils消息处理
 */
async function onUtilsMessage(msg, bot) {
  const contact = msg.talker(); // 发消息人
  if (contact.payload.name == config.MYSELF) {
    const room = msg.room()
    console.log('room', room)
    if (room && msg.text().includes('修改群名：')) {
      console.log(msg.text().replace('修改群名：', ''))
      await room.topic(msg.text().replace('修改群名：', ''))
    }
  }
  const isText = msg.type() === bot.Message.Type.Text;
  if (isText) {
    let content = msg.text().trim(); // 消息内容
    if (content.indexOf("转大写") === 0) {
      try {
        const str = content.replace("转大写", "").trim().toUpperCase();
        await msg.say(str);
      } catch (error) {
        await msg.say("转换失败，请检查");
      }
    } else if (content.indexOf("转小写") === 0) {
      try {
        const str = content.replace("转小写", "").trim().toLowerCase();
        await msg.say(str);
      } catch (error) {
        await msg.say("转换失败，请检查");
      }
    } else if (content.indexOf("转16进制") === 0) {
      try {
        const color = colorRGBtoHex(content.replace("转16进制", "").trim());
        await msg.say(color);
      } catch (error) {
        console.error(error);
        await msg.say("转换失败，请检查");
      }
    } else if (content.indexOf("转rgb") === 0) {
      try {
        const color = colorHex(content.replace("转rgb", "").trim());
        await msg.say(color);
      } catch (error) {
        console.error(error);
        await msg.say("转换失败，请检查");
      }
    } else if (content === "全国肺炎") {
      try {
        const res = await superagent.getChinaFeiyan();
        const chinaTotal = res.data.chinaTotal.total;
        const chinaToday = res.data.chinaTotal.today;
        const str = `全国新冠肺炎实时数据：<br>确诊：${
          chinaTotal.confirm
        }<br>较昨日：${
          chinaToday.confirm > 0 ? "+" + chinaToday.confirm : chinaToday.confirm
        }<br>疑似：${chinaTotal.suspect}<br>较昨日：${
          chinaToday.suspect > 0 ? "+" + chinaToday.suspect : chinaToday.suspect
        }<br>死亡：${chinaTotal.dead}<br>较昨日：${
          chinaToday.dead > 0 ? "+" + chinaToday.dead : chinaToday.dead
        }<br>治愈：${chinaTotal.heal}<br>较昨日：${
          chinaToday.heal > 0 ? "+" + chinaToday.heal : chinaToday.heal
        }<br>------------------<br>数据采集于网易，如有问题，请及时联系`;
        msg.say(str);
      } catch (error) {
        msg.say("接口错误");
      }
    } else if (content.includes("肺炎")) {
      const config = [
        "北京",
        "湖北",
        "广东",
        "浙江",
        "河南",
        "湖南",
        "重庆",
        "安徽",
        "四川",
        "山东",
        "吉林",
        "福建",
        "江西",
        "江苏",
        "上海",
        "广西",
        "海南",
        "陕西",
        "河北",
        "黑龙江",
        "辽宁",
        "云南",
        "天津",
        "山西",
        "甘肃",
        "内蒙古",
        "台湾",
        "澳门",
        "香港",
        "贵州",
        "西藏",
        "青海",
        "新疆",
        "宁夏"
      ];
      let newContent = content.replace("肺炎", "").trim();
      if (config.includes(newContent)) {
        const data = await superagent.getProvinceFeiyan(newContent);
        let citystr = "名称  确诊  治愈  死亡<br>";
        data.city.forEach(item => {
          citystr =
            citystr +
            `${item.name}  ${item.conNum}  ${item.cureNum}  ${item.deathNum}<br>`;
        });
        const str = `${newContent}新冠肺炎实时数据：<br>确诊：${data.value}<br>较昨日：${data.adddaily.conadd}<br>死亡：${data.deathNum}<br>较昨日：${data.adddaily.deathadd}<br>治愈：${data.cureNum}<br>较昨日：${data.adddaily.cureadd}<br>------------------<br>各地市实时数据：<br>${citystr}------------------<br>数据采集于新浪，如有问题，请及时联系`;
        msg.say(str);
      }
    } else {
      return true;
    }
  } else {
    return true;
  }
}
module.exports = onMessage;
