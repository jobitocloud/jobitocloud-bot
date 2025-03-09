// import fs from "fs";
// import TelegramBot from "node-telegram-bot-api";

// const token = "";
// const bot = new TelegramBot(token, { polling: true });

// bot.on("message", (message) => {
//   if (!allowedUsers.includes(message.chat.username as string)) {
//   }
// });

// bot.onText(/\/start|menu/, function onStartMenu(message) {
//   if (message.text!.startsWith("/start")) {
//     void bot.sendMessage(message.chat.id, "¡Hola!");
//   }
// });

// bot.onText(/\/files/, function onSamba(message) {
//   const files = fs.readdirSync("/Users/shared/jobitocloud", {
//     recursive: true,
//   });
//   const [, partialName] = (message.text ?? "").split(" ");
//   void bot.sendMessage(message.chat.id, "Elegí un archivo", {
//     reply_markup: {
//       inline_keyboard: files
//         .filter((file) => file.includes(partialName))
//         .map((file) => [
//           {
//             callback_data: "/downloadFile:" + file,
//             text: file,
//           },
//         ]),
//     },
//   });
// });

// bot.on("callback_query", (query) => {
//   if (query.data?.startsWith("/downloadFile")) {
//     const [, file] = query.data.split(":");
//     const binary = fs.readFileSync(`/users/shared/jobitocloud/${file}`);
//     void bot.upload;
//     void bot.sendDocument(query.message?.chat.id, binary);
//   }
// });

import { JobitoCloudBot } from "./bot";

const jcb = new JobitoCloudBot();
