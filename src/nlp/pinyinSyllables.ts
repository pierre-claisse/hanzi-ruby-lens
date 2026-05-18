/**
 * The complete set of valid pinyin syllables without tone marks, used by
 * `tokenizePinyin` for greedy longest-match splitting. Ported verbatim from
 * the previous Rust `PINYIN_SYLLABLES` table.
 */
export const PINYIN_SYLLABLES: ReadonlySet<string> = new Set([
  // Special standalone vowels
  "a", "o", "e", "ai", "ei", "ao", "ou", "an", "en", "ang", "eng", "er",
  // b-
  "ba", "bo", "bai", "bei", "bao", "ban", "ben", "bang", "beng", "bi",
  "bie", "biao", "bian", "bin", "bing", "bu",
  // p-
  "pa", "po", "pai", "pei", "pao", "pou", "pan", "pen", "pang", "peng",
  "pi", "pie", "piao", "pian", "pin", "ping", "pu",
  // m-
  "ma", "mo", "me", "mai", "mei", "mao", "mou", "man", "men", "mang",
  "meng", "mi", "mie", "miao", "miu", "mian", "min", "ming", "mu",
  // f-
  "fa", "fo", "fei", "fou", "fan", "fen", "fang", "feng", "fu",
  // d-
  "da", "de", "dai", "dei", "dao", "dou", "dan", "den", "dang", "deng",
  "di", "die", "diao", "diu", "dian", "ding", "dong", "du", "duo",
  "dui", "duan", "dun",
  // t-
  "ta", "te", "tai", "tei", "tao", "tou", "tan", "tang", "teng", "ti",
  "tie", "tiao", "tian", "ting", "tong", "tu", "tuo", "tui", "tuan", "tun",
  // n-
  "na", "ne", "nai", "nei", "nao", "nou", "nan", "nen", "nang", "neng",
  "ni", "nie", "niao", "niu", "nian", "nin", "niang", "ning", "nong",
  "nu", "nuo", "nuan", "nun", "nv", "nve",
  // l-
  "la", "le", "lai", "lei", "lao", "lou", "lan", "lang", "leng", "li",
  "lia", "lie", "liao", "liu", "lian", "lin", "liang", "ling", "long",
  "lu", "luo", "luan", "lun", "lv", "lve",
  // g-
  "ga", "ge", "gai", "gei", "gao", "gou", "gan", "gen", "gang", "geng",
  "gong", "gu", "gua", "guai", "guan", "guang", "gui", "gun", "guo",
  // k-
  "ka", "ke", "kai", "kei", "kao", "kou", "kan", "ken", "kang", "keng",
  "kong", "ku", "kua", "kuai", "kuan", "kuang", "kui", "kun", "kuo",
  // h-
  "ha", "he", "hai", "hei", "hao", "hou", "han", "hen", "hang", "heng",
  "hong", "hu", "hua", "huai", "huan", "huang", "hui", "hun", "huo",
  // j-
  "ji", "jia", "jie", "jiao", "jiu", "jian", "jin", "jiang", "jing",
  "jiong", "ju", "jue", "juan", "jun",
  // q-
  "qi", "qia", "qie", "qiao", "qiu", "qian", "qin", "qiang", "qing",
  "qiong", "qu", "que", "quan", "qun",
  // x-
  "xi", "xia", "xie", "xiao", "xiu", "xian", "xin", "xiang", "xing",
  "xiong", "xu", "xue", "xuan", "xun",
  // zh-
  "zha", "zhe", "zhi", "zhai", "zhei", "zhao", "zhou", "zhan", "zhen",
  "zhang", "zheng", "zhong", "zhu", "zhua", "zhuai", "zhuan", "zhuang",
  "zhui", "zhun", "zhuo",
  // ch-
  "cha", "che", "chi", "chai", "chao", "chou", "chan", "chen", "chang",
  "cheng", "chong", "chu", "chua", "chuai", "chuan", "chuang", "chui",
  "chun", "chuo",
  // sh-
  "sha", "she", "shi", "shai", "shei", "shao", "shou", "shan", "shen",
  "shang", "sheng", "shu", "shua", "shuai", "shuan", "shuang", "shui",
  "shun", "shuo",
  // r-
  "ran", "rang", "rao", "re", "ren", "reng", "ri", "rong", "rou",
  "ru", "rua", "ruan", "rui", "run", "ruo",
  // z-
  "za", "ze", "zi", "zai", "zei", "zao", "zou", "zan", "zen", "zang",
  "zeng", "zong", "zu", "zuo", "zui", "zuan", "zun",
  // c-
  "ca", "ce", "ci", "cai", "cao", "cou", "can", "cen", "cang", "ceng",
  "cong", "cu", "cuo", "cui", "cuan", "cun",
  // s-
  "sa", "se", "si", "sai", "sao", "sou", "san", "sen", "sang", "seng",
  "song", "su", "suo", "sui", "suan", "sun",
  // y-
  "ya", "ye", "yi", "yao", "you", "yan", "yin", "yang", "ying", "yong",
  "yu", "yue", "yuan", "yun",
  // w-
  "wa", "wo", "wai", "wei", "wan", "wen", "wang", "weng", "wu",
]);

/** Replace accented vowels with plain ASCII (and ü with v) for matching. */
export function stripToneMarks(s: string): string {
  let out = "";
  for (const ch of s) {
    switch (ch) {
      case "ā": case "á": case "ǎ": case "à": out += "a"; break;
      case "ē": case "é": case "ě": case "è": out += "e"; break;
      case "ī": case "í": case "ǐ": case "ì": out += "i"; break;
      case "ō": case "ó": case "ǒ": case "ò": out += "o"; break;
      case "ū": case "ú": case "ǔ": case "ù": out += "u"; break;
      case "ǖ": case "ǘ": case "ǚ": case "ǜ": out += "v"; break;
      default: out += ch;
    }
  }
  return out;
}

/**
 * Tokenize a concatenated pinyin string into exactly `expectedCount` syllables
 * via greedy longest-match against `PINYIN_SYLLABLES`. Tone marks are stripped
 * for matching but preserved in the output.
 *
 * Throws when no valid splitting exists.
 */
export function tokenizePinyin(pinyin: string, expectedCount: number): string[] {
  if (pinyin.length === 0) {
    throw new Error(`Cannot split pinyin '' into ${expectedCount} syllables`);
  }
  const normalized = stripToneMarks(pinyin);
  // Iterate by code point (not UTF-16 unit) to mirror Rust char semantics.
  const pinyinChars = [...pinyin];
  const normChars = [...normalized];
  const syllables: string[] = [];
  let pos = 0;

  while (pos < normChars.length) {
    const maxLen = Math.min(6, normChars.length - pos);
    let matched = false;
    for (let len = maxLen; len >= 1; len--) {
      const candidate = normChars.slice(pos, pos + len).join("");
      if (PINYIN_SYLLABLES.has(candidate)) {
        syllables.push(pinyinChars.slice(pos, pos + len).join(""));
        pos += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      throw new Error(
        `Cannot split pinyin '${pinyin}' into ${expectedCount} syllables`,
      );
    }
  }

  if (syllables.length !== expectedCount) {
    throw new Error(
      `Cannot split pinyin '${pinyin}' into ${expectedCount} syllables`,
    );
  }
  return syllables;
}
