import type pt from "../messages/pt.json";

type Messages = typeof pt;

declare global {
  interface IntlMessages extends Messages {}
}
