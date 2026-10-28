import en_US_petstore_home from "./en_US/petstore-home";
import en_US_petstore_cart from "./en_US/petstore-cart";
import en_US_petstore_signin from "./en_US/petstore-signin";
import en_US_change_language from "./en_US/change-language";
import en_US_change_language_success from "./en_US/change-language-success";
import en_US_header from "./en_US/header";
import ja_JP_petstore_home from "./ja_JP/petstore-home";
import ja_JP_petstore_cart from "./ja_JP/petstore-cart";
import ja_JP_petstore_signin from "./ja_JP/petstore-signin";
import ja_JP_change_language from "./ja_JP/change-language";
import ja_JP_change_language_success from "./ja_JP/change-language-success";
import ja_JP_header from "./ja_JP/header";
import zh_CN_petstore_home from "./zh_CN/petstore-home";
import zh_CN_petstore_cart from "./zh_CN/petstore-cart";
import zh_CN_petstore_signin from "./zh_CN/petstore-signin";
import zh_CN_change_language from "./zh_CN/change-language";
import zh_CN_change_language_success from "./zh_CN/change-language-success";
import zh_CN_header from "./zh_CN/header";
import type { LocaleRegistry } from "./types";

export const registry: LocaleRegistry = {
  en_US: {
    "petstore-home": en_US_petstore_home,
    "petstore-cart": en_US_petstore_cart,
    "petstore-signin": en_US_petstore_signin,
    "change-language": en_US_change_language,
    "change-language-success": en_US_change_language_success,
    header: en_US_header,
  },
  ja_JP: {
    "petstore-home": ja_JP_petstore_home,
    "petstore-cart": ja_JP_petstore_cart,
    "petstore-signin": ja_JP_petstore_signin,
    "change-language": ja_JP_change_language,
    "change-language-success": ja_JP_change_language_success,
    header: ja_JP_header,
  },
  zh_CN: {
    "petstore-home": zh_CN_petstore_home,
    "petstore-cart": zh_CN_petstore_cart,
    "petstore-signin": zh_CN_petstore_signin,
    "change-language": zh_CN_change_language,
    "change-language-success": zh_CN_change_language_success,
    header: zh_CN_header,
  },
};

export default registry;
