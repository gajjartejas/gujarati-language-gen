var barakhdi = require("./resources/barakhdi/barakhdi.json");
var kakko = require("./resources/kakko/kakko.json");
var numerals = require("./resources/numerals/numerals.json");

const fs = require("fs");
const TextToSVG = require("text-to-svg");
const textToSVG = TextToSVG.loadSync("./fonts/Noto_Sans_Gujarati/NotoSansGujarati-Light.ttf");
const attributes = {};
const options = { x: 0, y: 0, fontSize: 100, anchor: "left top", attributes: attributes };

const generateBarakhadiSvg = () => {
	for (let i = 0; i < barakhdi.length; i++) {
		const charConfig = barakhdi[i];
		const dir = `./resources/barakhdi/svgs/${i}_${charConfig.en.toLocaleLowerCase()}`;
		const chars = charConfig.chars;
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		for (let j = 0; j < chars.length; j++) {
			const char = chars[j];
			const svg = textToSVG.getSVG(char.gu, options);
			fs.writeFileSync(`${dir}/${char.id}_${char.en.replace(" / ", "_or_").toLowerCase()}.svg`, svg);
		}
	}
};

const generateKakkoSvg = () => {
	const dir = `./resources/kakko/svgs`;
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	for (let i = 0; i < kakko.length; i++) {
		const char = kakko[i];
		const svg = textToSVG.getSVG(char.gu, options);
		fs.writeFileSync(`${dir}/${char.id}_${char.en.replace(" / ", "_or_").toLowerCase()}.svg`, svg);
	}
};

const generateNumeralsSvg = () => {
	const dir = `./resources/numerals/svgs`;
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	for (let i = 0; i < numerals.length; i++) {
		const char = numerals[i];
		const svg = textToSVG.getSVG(char.gu, options);
		fs.writeFileSync(`${dir}/${char.en}.svg`, svg);
	}
};

const generateBarakhdiCsv = async () => {
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
	const dir = `./resources/barakhdi`;
	fs.writeFileSync(`${dir}/barakhdi.csv`, csvString);
};

const generateKakkoCsv = async () => {
	let csvString = "1,2,3\n";
	for (let i = 0; i < kakko.length; i++) {
		const char = kakko[i];

		csvString += `${i},${char.gu},${char.en}\n`;
	}
	const dir = `./resources/kakko`;
	fs.writeFileSync(`${dir}/kakko.csv`, csvString);
};

const generateNumeralsCsv = async () => {
	let csvString = "id,English,Gujarati,English Name,Gujarati Name\n";
	for (let i = 0; i < numerals.length; i++) {
		const char = numerals[i];

		csvString += `${i},${char.en},${char.gu},${char.name_en},${char.name_gu}\n`;
	}
	const dir = `./resources/numerals`;
	fs.writeFileSync(`${dir}/numerals.csv`, csvString);
};

const generateResources = () => {
	generateBarakhadiSvg()
	generateKakkoSvg()

	generateBarakhdiCsv()
	generateKakkoCsv()

	generateNumeralsSvg()
	generateNumeralsCsv()
}

generateResources()