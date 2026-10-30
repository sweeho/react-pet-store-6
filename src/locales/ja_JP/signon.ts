import type { ScreenDefinition } from "../types";

const definition: ScreenDefinition = {
  title: "サインイン",
  mainPage: "ペットストア",
  account: "アカウント",
  cart: "カート",
  signIn: "サインイン",
  signOut: "サインアウト",
  intro: "アカウントの編集とご注文にはサインインが必要です。サインイン中もカートは保持されます。",
  returningTitle: "登録済みのお客様",
  returningHelp: "登録時に決めたユーザー名とパスワードでサインインしてください。",
  userId: "ユーザーID",
  password: "パスワード",
  remember: "ユーザー名を記憶する",
  rememberHint: "このブラウザーに31日間保存されます。",
  failed: "ユーザーIDまたはパスワードが正しくありません。確認してもう一度お試しください。",
  newTitle: "新規のお客様",
  newHelp: "ユーザー名とパスワードを決めてください。次に連絡先とカード情報を入力します。",
  newUserName: "ユーザー名",
  newSecret: "パスワード",
  newSecretAgain: "パスワード（確認）",
  signUpFailed: "アカウントを作成できませんでした。入力内容を確認してもう一度お試しください。",
  create: "新規アカウントを作成",
  idleNote: "セキュリティのため、15分間操作がないとサインアウトされ、カートは空になります。",
  signedOutTitle: "サインアウトしました",
  signedOutMessage: "ペットストアをご利用いただきありがとうございました。カートは空になりました。",
  signInAgain: "もう一度サインイン",
  backHome: "ホームに戻る",
  accountTitle: "アカウント",
  signedInAs: "サインイン中のユーザー",
};

export default definition;
