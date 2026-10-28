import { defineHandler } from "nitro/h3";

import { requestLocale } from "../../../services/locale";

export default defineHandler((event) => ({ locale: requestLocale(event) }));
