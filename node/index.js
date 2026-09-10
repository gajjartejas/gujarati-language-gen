const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");
const TextToSVG = require("text-to-svg");

// Resolve directories relative to repository root
const ROOT_DIR = path.resolve(__dirname, "..");
const RESOURCES_DIR = path.resolve(ROOT_DIR, "resources");
const FONTS_DIR = path.resolve(ROOT_DIR, "fonts");

const barakhdi = require(path.join(RESOURCES_DIR, "barakhdi/barakhdi.json"));
const kakko = require(path.join(RESOURCES_DIR, "kakko/kakko.json"));
const numerals = require(path.join(RESOURCES_DIR, "numerals/numerals.json"));

const fontPath = path.join(FONTS_DIR, "Noto_Sans_Gujarati/NotoSansGujarati-Light.ttf");
const textToSVG = TextToSVG.loadSync(fontPath);

const attributes = {};
const options = {
  x: 0,
  y: 0,
  fontSize: 100,
  anchor: "left top",
  attributes: attributes,
};

const generateBarakhadiSvg = () => {
  for (let i = 0; i < barakhdi.length; i++) {
    const charConfig = barakhdi[i];
    const dir = path.join(RESOURCES_DIR, `barakhdi/svgs/${i}_${charConfig.en.toLocaleLowerCase()}`);
    const chars = charConfig.chars;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    for (let j = 0; j < chars.length; j++) {
      const char = chars[j];
      const svg = textToSVG.getSVG(char.gu, options);
      fs.writeFileSync(
        path.join(dir, `${char.id}_${char.en.replace(" / ", "_or_").toLowerCase()}.svg`),
        svg
      );
    }
  }
};

const generateKakkoSvg = () => {
  const dir = path.join(RESOURCES_DIR, "kakko/svgs");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  for (let i = 0; i < kakko.length; i++) {
    const char = kakko[i];
    const svg = textToSVG.getSVG(char.gu, options);
    fs.writeFileSync(
      path.join(dir, `${char.id}_${char.en.replace(" / ", "_or_").toLowerCase()}.svg`),
      svg
    );
  }
};

const generateNumeralsSvg = () => {
  const dir = path.join(RESOURCES_DIR, "numerals/svgs");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  for (let i = 0; i < numerals.length; i++) {
    const char = numerals[i];
    const svg = textToSVG.getSVG(char.gu, options);
    fs.writeFileSync(path.join(dir, `${char.en}.svg`), svg);
  }
};

const generateBarakhdiCsv = () => {
  let csvString = "1,2,3,4,5,6,7,8,9,10,11,12,13\n";
  for (let i = 0; i < barakhdi.length; i++) {
    const charConfig = barakhdi[i];
    const chars = charConfig.chars;
    let enArray = [];
    let guArray = [];
    for (let j = 0; j < chars.length; j++) {
      const char = chars[j];
      enArray.push(char.en);
      guArray.push(char.gu);
    }
    csvString += `${i},${guArray.join(",")}\n${i},${enArray.join(",")}\n`;
  }
  const dir = path.join(RESOURCES_DIR, "barakhdi");
  fs.writeFileSync(path.join(dir, "barakhdi.csv"), csvString);
};

const generateKakkoCsv = () => {
  let csvString = "1,2,3\n";
  for (let i = 0; i < kakko.length; i++) {
    const char = kakko[i];
    csvString += `${i},${char.gu},${char.en}\n`;
  }
  const dir = path.join(RESOURCES_DIR, "kakko");
  fs.writeFileSync(path.join(dir, "kakko.csv"), csvString);
};

const generateNumeralsCsv = () => {
  let csvString = "id,English,Gujarati,English Name,Gujarati Name\n";
  for (let i = 0; i < numerals.length; i++) {
    const char = numerals[i];
    csvString += `${i},${char.en},${char.gu},${char.name_en},${char.name_gu}\n`;
  }
  const dir = path.join(RESOURCES_DIR, "numerals");
  fs.writeFileSync(path.join(dir, "numerals.csv"), csvString);
};

const generateNumeralsAudio = async (section) => {
  const dir = path.join(RESOURCES_DIR, "numerals/audio");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  for (let i = 0; i < numerals.length; i++) {
    if (i < section) {
      continue;
    }
    const char = numerals[i];
    let audioBase64 = await getAudioBase64(char.gu);
    const buffer = Buffer.from(audioBase64, "base64");
    fs.writeFileSync(path.join(dir, `${char.en}.mp3`), buffer);
  }
};

const generateBarakhadiAudio = async (section, row) => {
  for (let i = 0; i < barakhdi.length; i++) {
    if (i < section) {
      continue;
    }
    const charConfig = barakhdi[i];
    const dir = path.join(RESOURCES_DIR, `barakhdi/audio/${i}_${charConfig.en.toLocaleLowerCase()}`);
    const chars = charConfig.chars;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    for (let j = 0; j < chars.length; j++) {
      if (i < section && j < row) {
        continue;
      }
      const char = chars[j];
      let audioBase64 = await getAudioBase64(char.gu);
      const buffer = Buffer.from(audioBase64, "base64");
      fs.writeFileSync(
        path.join(dir, `${char.id}_${char.en.replace(" / ", "_or_").toLowerCase()}.mp3`),
        buffer
      );
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
};

const generateKakkoAudio = async (section) => {
  const dir = path.join(RESOURCES_DIR, "kakko/audio");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  for (let i = 0; i < kakko.length; i++) {
    if (i < section) {
      continue;
    }
    const char = kakko[i];
    let audioBase64 = await getAudioBase64(char.gu);
    const buffer = Buffer.from(audioBase64, "base64");
    fs.writeFileSync(
      path.join(dir, `${char.id}_${char.en.replace(" / ", "_or_").toLowerCase()}.mp3`),
      buffer
    );
  }
};

const getAudioBase64 = async (char) => {
  const response = await fetch(
    "https://cxl-services.appspot.com/proxy?url=https://texttospeech.googleapis.com/v1beta1/text:synthesize&token=03AAYGu2Td5wXEpHc9QM67XZx756oCCcQmqvl0hHlz8Vf5n0D--kfAcaNh8_V_V3Jhu7vDbBRHnRLV3glVlenrGtHgMG9EEf3qpdLxorQqEK0g0YaWd5C9gGHqVWcX7yltoix4nMJFTkElcYYzuwHcI0EQzMZdzoPQdrUJvTMkkaspsw0kRvG6E0VYdMri5WquFDauwzIgJJDhAs4gJDX5mIEZAxgC3i78dGTbs3V4-szx291a_syzO2AsSE-NL0i6DlRzVxV2frXujgrLQQGBZ_LQf6UO4SLACka2_d6jrPB2-91kair_LH6CBoHmknYpvhU2WLnWoJYxCDtWYvUBij12MOXsw4tDIbD1Dofb8y1FGorpG73nHA7PFz2XgkMPQuLdpai5RwvtH2DrphkcJSR3t8i7f3zjl8u_vUhZfj2gC_Ymdz7_28s5OAcDdtx-lu7LNoDzKjnQ0Q-vMQAcNGd6i98PQeg5NCxuK7Q2XhgqEiGc05CLKkr7ZzE9GPKg5WvMnVbHGf69lZ7oJkB3eFmbc7hJe58LkC1y8sT2nzVL3iEiyZMe2_o",
    {
      headers: {
        accept: "*/*",
        "accept-language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,gu;q=0.6",
        "content-type": "text/plain;charset=UTF-8",
        "sec-ch-ua":
          '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        Referer: "https://www.gstatic.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: `{"input":{"text":"${char}"},"voice":{"languageCode":"gu-IN","name":"gu-IN-Wavenet-A"},"audioConfig":{"audioEncoding":"LINEAR16","pitch":0,"speakingRate":0.55}}`,
      method: "POST",
    }
  );

  const jsonData = await response.json();
  return jsonData.audioContent;
};

const generateAudio = async () => {
  await generateBarakhadiAudio(0, 0);
  await generateNumeralsAudio(0);
  await generateKakkoAudio(0);
};

const generateResources = () => {
  generateBarakhadiSvg();
  generateBarakhdiCsv();
  generateNumeralsSvg();

  generateKakkoSvg();
  generateKakkoCsv();
  generateNumeralsCsv();
};

generateResources();
