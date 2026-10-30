import type { ScreenDefinition } from "../types";

const definition: ScreenDefinition = {
  title: "登录",
  mainPage: "宠物商店",
  account: "账户",
  cart: "购物车",
  signIn: "登录",
  signOut: "退出登录",
  intro: "登录后才能编辑账户和结账。登录期间购物车会保留。",
  returningTitle: "老客户",
  returningHelp: "请使用注册时设置的用户名和密码登录。",
  userId: "用户ID",
  password: "密码",
  remember: "记住我的用户名",
  rememberHint: "在此浏览器上保存31天。",
  failed: "用户ID或密码无法识别，请检查后重试。",
  newTitle: "新客户",
  newHelp: "请设置用户名和密码，接下来填写联系方式和银行卡信息。",
  newUserName: "用户名",
  newSecret: "密码",
  newSecretAgain: "重复密码",
  signUpFailed: "无法创建账户。请检查信息后重试。",
  create: "创建新账户",
  idleNote: "为了安全，15分钟无操作将自动退出登录，购物车会被清空。",
  signedOutTitle: "您已退出登录",
  signedOutMessage: "感谢访问宠物商店。您的购物车已清空。",
  signInAgain: "重新登录",
  backHome: "返回首页",
  accountTitle: "账户",
  signedInAs: "当前登录用户",
};

export default definition;
